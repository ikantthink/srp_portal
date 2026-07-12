import { Html, Head, Body, Container, Heading, Text, Hr, Preview, Link } from "@react-email/components";
import { stripDangerousTags } from "@/lib/puck/fields/sanitize-html";

interface NewsletterBaseProps {
  subject: string;
  previewText: string;
  bodyHtml: string;
}

export default function NewsletterBase({
  subject = "Monthly Newsletter",
  previewText = "Check out our latest updates",
  bodyHtml = "<p>Newsletter content goes here.</p>",
}: NewsletterBaseProps) {
  const safeBody = stripDangerousTags(bodyHtml);

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px" }}>
          <Heading style={{ fontSize: "28px", textAlign: "center" as const }}>{subject}</Heading>
          <Hr />
          <div dangerouslySetInnerHTML={{ __html: safeBody }} />
          <Hr />
          <Text style={{ textAlign: "center" as const, color: "#9ca3af", fontSize: "12px" }}>
            SRP Real Estate &middot; <Link href="{{unsubscribe_url}}">Unsubscribe</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
