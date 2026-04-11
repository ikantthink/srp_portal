import { Html, Head, Body, Container, Heading, Text, Hr, Preview } from "@react-email/components";

interface FormResponseProps {
  formName: string;
  submissionData: Record<string, string>;
}

export default function FormResponse({ formName = "Contact Form", submissionData = {} }: FormResponseProps) {
  return (
    <Html>
      <Head />
      <Preview>New submission from {formName}</Preview>
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f4f4f5" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "20px", backgroundColor: "#ffffff", borderRadius: "8px" }}>
          <Heading style={{ fontSize: "24px", marginBottom: "16px" }}>
            New Form Submission
          </Heading>
          <Text style={{ color: "#6b7280" }}>
            A new submission was received from <strong>{formName}</strong>.
          </Text>
          <Hr />
          {Object.entries(submissionData).map(([key, value]) => (
            <div key={key} style={{ marginBottom: "8px" }}>
              <Text style={{ fontWeight: "bold", marginBottom: "0" }}>{key}</Text>
              <Text style={{ color: "#374151", marginTop: "0" }}>{value}</Text>
            </div>
          ))}
        </Container>
      </Body>
    </Html>
  );
}
