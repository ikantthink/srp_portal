import { Html, Head, Body, Container, Heading, Text, Hr, Preview } from "@react-email/components";

interface LeadNotificationProps {
  leadName: string;
  leadEmail: string;
  leadType: string;
  source: string;
}

export default function LeadNotification({
  leadName = "John Doe",
  leadEmail = "john@example.com",
  leadType = "buying",
  source = "website",
}: LeadNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>New lead: {leadName}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px" }}>
          <Heading style={{ fontSize: "24px" }}>New Lead Received</Heading>
          <Text><strong>Name:</strong> {leadName}</Text>
          <Text><strong>Email:</strong> {leadEmail}</Text>
          <Text><strong>Type:</strong> {leadType}</Text>
          <Text><strong>Source:</strong> {source}</Text>
        </Container>
      </Body>
    </Html>
  );
}
