import { LegalLayout } from "../landing/LegalLayout";

import ComplaintForm from "./ComplaintForm";

export default function ComplaintsBook() {
  return (
    <LegalLayout>
      <ComplaintForm
        initialValues={{
          firstName: "",
          lastName: "",
          dni: "",
          address: "",
          email: "",
          comment: "",
        }}
      />
    </LegalLayout>
  );
}
