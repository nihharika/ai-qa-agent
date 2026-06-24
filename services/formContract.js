export const validationMessages = {
  name: "Name must contain only letters/spaces and start with a capital letter.",
  email: "Email must be valid and contain @.",
  phone: "Phone must be exactly 10 digits.",
  city: "City must contain only letters/spaces.",
  message:
    "Message must be 10-200 characters and must not contain SQL/script injection text."
};

export const formContract = {
  formName: "Test Form",
  submitButtonTestId: "submit",
  resultTestId: "form-result",
  fields: [
    {
      name: "name",
      label: "Name",
      testId: "name-input",
      rules: [
        "Required",
        "Only letters and spaces",
        "First letter must be capital",
        "Length must be 2 to 50 characters"
      ]
    },
    {
      name: "email",
      label: "Email",
      testId: "email-input",
      rules: ["Required", "Must contain @", "Must have a valid domain"]
    },
    {
      name: "phone",
      label: "Phone",
      testId: "phone-input",
      rules: ["Required", "Must be exactly 10 digits"]
    },
    {
      name: "city",
      label: "City",
      testId: "city-input",
      rules: ["Required", "Only letters and spaces", "Length must be 2 to 50 characters"]
    },
    {
      name: "message",
      label: "Message",
      testId: "message-input",
      rules: [
        "Required",
        "Length must be 10 to 200 characters",
        "Must reject SQL injection or script injection text"
      ]
    }
  ],
  expectedSuccessText: "Form submitted successfully.",
  expectedErrorText: "Please fix the validation errors."
};

const sqlOrScriptPattern =
  /(<script|<\/script>|drop\s+table|--|;\s*drop|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|select\s+\*|union\s+select)/i;

export function validateFormData(data = {}) {
  const errors = {};

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const phone = String(data.phone || "").trim();
  const city = String(data.city || "").trim();
  const message = String(data.message || "").trim();

  if (!/^[A-Z][A-Za-z ]{1,49}$/.test(name)) {
    errors.name = validationMessages.name;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = validationMessages.email;
  }

  if (!/^\d{10}$/.test(phone)) {
    errors.phone = validationMessages.phone;
  }

  if (!/^[A-Za-z ]{2,50}$/.test(city)) {
    errors.city = validationMessages.city;
  }

  if (
    message.length < 10 ||
    message.length > 200 ||
    sqlOrScriptPattern.test(message)
  ) {
    errors.message = validationMessages.message;
  }

  return errors;
}