import { Html, Head, Body, Container, Heading, Text, Link, Hr, Preview } from "@react-email/components";

interface InviteUserProps {
  inviterName: string;
  role: string;
  acceptUrl: string;
}

export default function InviteUser({
  inviterName = "A team member",
  role = "user",
  acceptUrl = "https://example.com/accept-invite?token=example",
}: InviteUserProps) {
  return (
    <Html>
      <Head />
      <Preview>You've been invited to the SRP Portal</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "16px" }}>
            You&apos;re invited to the SRP Portal
          </Heading>
          <Text style={{ color: "#374151" }}>
            {inviterName} invited you to join the SRP Portal as a <strong>{role.replace("_", " ")}</strong>.
          </Text>
          <Text>
            <Link href={acceptUrl} style={{ color: "#2563eb" }}>
              Accept invite &amp; set up your account
            </Link>
          </Text>
          <Hr />
          <Text style={{ color: "#6b7280", fontSize: "13px" }}>
            This invite expires in 7 days. If you weren&apos;t expecting this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
