import { Html, Head, Body, Container, Heading, Text, Hr, Preview } from "@react-email/components";

interface TransactionUpdateProps {
  propertyAddress: string;
  milestone: string;
  status: string;
  agentName: string;
}

export default function TransactionUpdate({
  propertyAddress = "123 Main St",
  milestone = "Inspection",
  status = "completed",
  agentName = "Jane Smith",
}: TransactionUpdateProps) {
  return (
    <Html>
      <Head />
      <Preview>Transaction Update: {propertyAddress}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px" }}>
          <Heading style={{ fontSize: "24px" }}>Transaction Update</Heading>
          <Text><strong>Property:</strong> {propertyAddress}</Text>
          <Text><strong>Milestone:</strong> {milestone}</Text>
          <Text><strong>Status:</strong> {status}</Text>
          <Hr />
          <Text style={{ color: "#6b7280" }}>
            Updated by {agentName}. Log in to the portal for full details.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
