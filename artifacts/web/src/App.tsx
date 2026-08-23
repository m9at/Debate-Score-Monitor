import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import type { ReactNode, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TournamentProvider } from "@/context/TournamentContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GroupProvider } from "@/context/GroupContext";
import Home from "@/pages/home";
import GroupDetail from "@/pages/group-detail";
import TournamentDetail from "@/pages/tournament-detail";
import TournamentNewPage from "@/pages/tournament-new";
import MatchScoring from "@/pages/match-scoring";
import Leaderboard from "@/pages/leaderboard";
import TeamHistory from "@/pages/team-history";
import ResultsPage from "@/pages/results";
import JudgePage from "@/pages/judge";
import JudgeRoundPage from "@/pages/judge-round";
import RegisterPage from "@/pages/register";
import JudgeRegisterPage from "@/pages/judge-register";
import JudgesPublicPage from "@/pages/judges-public";
import ImportPage from "@/pages/import";
import StatsPage from "@/pages/stats";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as
  | string
  | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo-mark.png`,
  },
  variables: {
    colorPrimary: "#7B2D8E",
    colorForeground: "#1a1a1a",
    colorMutedForeground: "#666666",
    colorDanger: "#FF3B30",
    colorBackground: "#ffffff",
    colorInput: "#f7f7f9",
    colorInputForeground: "#1a1a1a",
    colorNeutral: "#e5e5e5",
    colorModalBackdrop: "rgba(15, 15, 30, 0.55)",
    fontFamily: "Cairo, sans-serif",
    borderRadius: "14px",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#1a1a1a] font-bold",
    headerSubtitle: "text-[#666666]",
    socialButtonsBlockButtonText: "text-[#1a1a1a] font-medium",
    formFieldLabel: "text-[#1a1a1a] font-medium",
    footerActionLink: "text-[#7B2D8E] font-semibold hover:text-[#5D1F6D]",
    footerActionText: "text-[#666666]",
    dividerText: "text-[#666666]",
    identityPreviewEditButton: "text-[#7B2D8E]",
    formFieldSuccessText: "text-[#29ABE2]",
    alertText: "text-[#1a1a1a]",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-14 w-auto rounded-xl",
    socialButtonsBlockButton:
      "border border-[#e5e5e5] hover:bg-[#f7f7f9] rounded-xl",
    formButtonPrimary:
      "bg-[#7B2D8E] hover:bg-[#5D1F6D] rounded-xl font-bold text-white",
    formFieldInput:
      "bg-[#f7f7f9] border border-[#e5e5e5] rounded-xl text-[#1a1a1a]",
    footerAction: "py-3",
    dividerLine: "bg-[#e5e5e5]",
    alert: "rounded-xl",
    otpCodeFieldInput: "rounded-xl border border-[#e5e5e5]",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "مناظرات عُمان · Oman Debates",
      subtitle: "سجّل دخولك للوصول إلى لوحة إدارة البطولات",
    },
  },
  signUp: {
    start: {
      title: "إنشاء حساب جديد",
      subtitle: "للمشرفين المعتمدين فقط",
    },
  },
};

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] items-center justify-center bg-background px-4"
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div
      dir="rtl"
      className="flex min-h-[100dvh] items-center justify-center bg-background px-4"
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function withAuth<P extends object>(Component: ComponentType<P>) {
  const Wrapped = (props: P) => (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  );
  Wrapped.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}

function Router() {
  return (
    <Switch>
      {/* Auth routes (kept available but not required) */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      {/* All routes are now public */}
      <Route path="/register" component={RegisterPage} />
      <Route path="/judge-register" component={JudgeRegisterPage} />
      <Route path="/judges-public" component={JudgesPublicPage} />
      <Route path="/results/:id" component={ResultsPage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/judge/round/:sessionId" component={JudgeRoundPage} />
      <Route path="/judge/:sessionId" component={JudgePage} />

      <Route path="/" component={Home} />
      <Route path="/group/:id" component={GroupDetail} />
      <Route path="/tournament/new" component={TournamentNewPage} />
      <Route path="/tournament/:id" component={TournamentDetail} />
      <Route
        path="/match/:tournamentId/:roundNumber/:matchId"
        component={MatchScoring}
      />
      <Route path="/leaderboard/:id" component={Leaderboard} />
      <Route
        path="/team-history/:tournamentId/:teamId"
        component={TeamHistory}
      />
      <Route path="/stats/:id" component={StatsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  if (!clerkPubKey) {
    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] flex items-center justify-center p-6 text-center"
      >
        <div>
          <div className="text-lg font-bold mb-2">
            تعذّر تحميل نظام الدخول
          </div>
          <div className="text-sm text-muted-foreground">
            مفتاح Clerk غير موجود في إعدادات البيئة.
          </div>
        </div>
      </div>
    );
  }
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <Router />
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TournamentProvider>
        <GroupProvider>
          <TooltipProvider>
            <WouterRouter base={basePath}>
              <ClerkProviderWithRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </GroupProvider>
      </TournamentProvider>
    </ThemeProvider>
  );
}

export default App;
