import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - webmcp.land",
  description: "Privacy Policy for webmcp.land",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-muted-foreground">
            webmcp.land is an open-source platform for discovering, registering, and sharing MCP and WebMCP services.
            All resources shared on this platform are released under the{" "}
            <Link href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Apache License 2.0
            </Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Information We Collect</h2>
          <p className="text-muted-foreground">
            When you create an account, we collect:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Email address (for authentication)</li>
            <li>Username and display name</li>
            <li>Profile information you choose to provide</li>
          </ul>
          <p className="text-muted-foreground">
            When you use the platform, we collect:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>MCP/WebMCP resources you register and share</li>
            <li>Categories and tags you assign to resources</li>
            <li>Analytics data through Google Analytics to understand usage patterns (can be disabled on self-hosted instances)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use collected information to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Provide and maintain the service</li>
            <li>Associate resources with your account</li>
            <li>Enable discovery of resources by other users</li>
            <li>Improve the platform based on usage patterns</li>
            <li>Detect and prevent abuse, spam, and unusual activity</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Account Monitoring & Flagging</h2>
          <p className="text-muted-foreground">
            We monitor account activity to maintain platform quality and prevent abuse. If unusual or abusive
            activity is detected, your account may be flagged. This information is stored internally and includes:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Flag status (whether your account is flagged)</li>
            <li>Date when the flag was applied</li>
            <li>Reason for the flag</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            Flagged accounts are subject to restrictions including a daily limit of 5 resources and automatic
            unlisting of new resources. This data is only visible to administrators and is used solely for
            platform integrity purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Data Sharing</h2>
          <p className="text-muted-foreground">
            Resources you share are public and released under the Apache-2.0 license. Your username will be displayed
            alongside your resources. We do not sell your personal information to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Analytics & Cookies</h2>
          <p className="text-muted-foreground">
            We use essential cookies for authentication and session management. We use Google Analytics
            to understand how the service is used, including tracking events such as resource views, searches,
            and interactions. On self-hosted instances, analytics can be disabled by not setting the
            <code className="px-1 py-0.5 bg-muted rounded text-xs">GOOGLE_ANALYTICS_ID</code> environment variable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your Rights & Apache-2.0 License</h2>
          <p className="text-muted-foreground">
            You can:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Access and update your account information</li>
            <li>Download any resources directly from the platform (all resources are Apache-2.0 licensed and publicly available)</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            <strong>Important:</strong> All resources are released under the Apache-2.0 license. Once published,
            they are freely available for anyone to use, modify, and distribute under the terms of that license.
            Account deletion does not remove resources you have contributed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Open Source</h2>
          <p className="text-muted-foreground">
            This platform is open source. You can review the code and self-host your own instance at{" "}
            <Link href="https://github.com/eser/webmcp.land" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              GitHub
            </Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            For privacy-related inquiries, please open an issue on our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
