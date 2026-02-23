import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import VesperLogo from "@/components/VesperLogo";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import { useAuth } from "@/context/auth";
import type { AuthUser } from "@/context/auth";
import Colors from "@/constants/Colors";
import LoginBackdrop from "@/components/LoginBackdrop";
import LoopingFadeText from "@/components/LoopingFadeText";

// Warm up the browser to improve UX
WebBrowser.maybeCompleteAuthSession();

const HERO_TEXTS = [
  "Ready To Explore",
  "Build With VesperAI",
  "Search And Create",
  "Think Faster Today",
];

interface WorkOsAuthenticateResponse {
  access_token?: string;
  user?: WorkOsProfile;
  profile?: WorkOsProfile;
  message?: string;
  error_description?: string;
}

interface WorkOsProfile {
  id?: string;
  sub?: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
  picture?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  raw_attributes?: Record<string, unknown>;
  rawAttributes?: Record<string, unknown>;
}

function getNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readProfileField(profile: WorkOsProfile | undefined, keys: string[]) {
  if (!profile) {
    return null;
  }

  for (const key of keys) {
    const directValue = getNonEmptyString(
      (profile as Record<string, unknown>)[key],
    );
    if (directValue) {
      return directValue;
    }
  }

  const rawAttributes = profile.raw_attributes ?? profile.rawAttributes;
  if (!rawAttributes) {
    return null;
  }

  for (const key of keys) {
    const rawValue = getNonEmptyString(rawAttributes[key]);
    if (rawValue) {
      return rawValue;
    }
  }

  return null;
}

function toBase64Url(value: string) {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createPkcePair() {
  const codeVerifier = Array.from(Crypto.getRandomBytes(64), byte =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  const hashedVerifier = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );

  return {
    codeVerifier,
    codeChallenge: toBase64Url(hashedVerifier),
  };
}

async function exchangeCodeForProfile({
  clientId,
  code,
  codeVerifier,
  redirectUri,
}: {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<{ accessToken: string; user: AuthUser }> {
  const response = await fetch(
    "https://api.workos.com/user_management/authenticate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
      }),
    },
  );

  const payload = (await response.json()) as WorkOsAuthenticateResponse;

  if (!response.ok) {
    throw new Error(
      payload.error_description ||
        payload.message ||
        "Could not authenticate with WorkOS",
    );
  }

  const profileSource = payload.user ?? payload.profile;
  const email = readProfileField(profileSource, ["email"]);

  if (!payload.access_token || !email) {
    throw new Error("WorkOS did not return a valid user profile");
  }

  const user: AuthUser = {
    id: readProfileField(profileSource, ["id", "sub"]) || email,
    email,
    firstName: readProfileField(profileSource, [
      "first_name",
      "firstName",
      "given_name",
    ]),
    lastName: readProfileField(profileSource, [
      "last_name",
      "lastName",
      "family_name",
    ]),
    profilePictureUrl: readProfileField(profileSource, [
      "profile_picture_url",
      "profilePictureUrl",
      "picture",
      "avatar_url",
      "avatar",
      "image_url",
      "image",
      "photo_url",
      "photo",
    ]),
  };

  return {
    accessToken: payload.access_token,
    user,
  };
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const handleAuth = async (provider: "AppleOAuth" | "GoogleOAuth") => {
    try {
      const clientId = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID;
      if (!clientId) {
        Alert.alert(
          "Configuration Error",
          "Missing EXPO_PUBLIC_WORKOS_CLIENT_ID in your .env.local file",
        );
        return;
      }

      const redirectUri = makeRedirectUri({
        scheme: "vesperai",
      });

      const { codeVerifier, codeChallenge } = await createPkcePair();
      const state = Crypto.randomUUID();

      const authParams = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        provider,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        scope: "openid profile email",
      });

      const authUrl = `https://api.workos.com/sso/authorize?${authParams.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
      );

      if (result.type === "success" && result.url) {
        const { queryParams } = Linking.parse(result.url);

        const returnedState =
          typeof queryParams?.state === "string" ? queryParams.state : null;
        const code =
          typeof queryParams?.code === "string" ? queryParams.code : null;

        if (returnedState && returnedState !== state) {
          Alert.alert(
            "Authentication Failed",
            "State mismatch. Please try again.",
          );
          return;
        }

        if (code) {
          const { accessToken, user } = await exchangeCodeForProfile({
            clientId,
            code,
            codeVerifier,
            redirectUri,
          });

          await signIn(accessToken, user);
        } else if (queryParams?.error) {
          Alert.alert("Authentication Failed", queryParams.error as string);
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Authentication Error",
        error?.message || "An error occurred",
      );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <LoginBackdrop />

      {/* Content Area */}
      <View className="flex-1 px-6 pb-12 pt-24">
        {/* Top Section: Logo & Typography */}
        <View className="flex-1 items-center justify-center self-stretch">
          <VesperLogo width={156} />

          <LoopingFadeText
            texts={HERO_TEXTS}
            intervalMs={3000}
            staggerMs={28}
            durationMs={320}
            containerStyle={{
              marginTop: 24,
              minHeight: 96,
              alignSelf: "center",
              justifyContent: "center",
            }}
            textStyle={{
              textAlign: "center",
              fontSize: 44,
              lineHeight: 48,
              fontWeight: "800",
              letterSpacing: -0.6,
              color: colorScheme === "dark" ? "#efe3c4" : "#2b2930",
            }}
          />
        </View>

        {/* Bottom Section: Auth Card */}
        <View className="w-full rounded-[32px] bg-background/95 p-6 shadow-sm dark:bg-card/95">
          <Pressable
            onPress={() => handleAuth("AppleOAuth")}
            className="mb-4 flex-row items-center justify-center gap-3 rounded-full bg-foreground py-4 active:opacity-80"
          >
            <FontAwesome name="apple" size={22} color={theme.background} />
            <Text className="text-base font-semibold text-background">
              Continue with Apple
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handleAuth("GoogleOAuth")}
            className="flex-row items-center justify-center gap-3 rounded-full border border-border bg-background py-4 active:bg-accent"
          >
            <FontAwesome name="google" size={22} color={theme.foreground} />
            <Text className="text-base font-semibold text-foreground">
              Continue with Google
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
