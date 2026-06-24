const validationMessages = {
  name: "Name must contain only letters/spaces and start with a capital letter.",
  email: "Email must be valid and contain @.",
  phone: "Phone must be exactly 10 digits.",
  city: "City must contain only letters/spaces.",
  message:
    "Message must be 10-200 characters and must not contain SQL/script injection text."
};

const sqlOrScriptPattern =
  /(<script|<\/script>|drop\s+table|--|;\s*drop|'\s*or\s*'1'\s*=\s*'1|"\s*or\s*"1"\s*=\s*"1|select\s+\*|union\s+select)/i;

const fields = ["name", "email", "phone", "city", "message"];

const form = document.querySelector("#testForm");
const resultBox = document.querySelector("#formResult");
const runAiTestsBtn = document.querySelector("#runAiTestsBtn");
const testOutput = document.querySelector("#testOutput");
const testLinks = document.querySelector("#testLinks");

function getField(field) {
  return document.querySelector(`#${field}`);
}

function getFormData() {
  return {
    name: getField("name").value,
    email: getField("email").value,
    phone: getField("phone").value,
    city: getField("city").value,
    message: getField("message").value
  };
}

function validateFormData(data) {
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

function clearErrors() {
  for (const field of fields) {
    const input = getField(field);
    const error = document.querySelector(`[data-error-for="${field}"]`);

    input.removeAttribute("aria-invalid");
    error.textContent = "";
  }
}

function showErrors(errors) {
  clearErrors();

  for (const [field, message] of Object.entries(errors)) {
    const input = getField(field);
    const error = document.querySelector(`[data-error-for="${field}"]`);

    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
  }
}

function showResult(status, message) {
  resultBox.hidden = false;
  resultBox.dataset.status = status;
  resultBox.textContent = message;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = getFormData();
  const errors = validateFormData(data);

  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    showResult("error", "Please fix the validation errors.");
    return;
  }

  clearErrors();
  showResult("success", "Form submitted successfully.");
});

runAiTestsBtn.addEventListener("click", async () => {
  runAiTestsBtn.disabled = true;
  testLinks.innerHTML = "";
  testOutput.textContent = "Running Gemini + Playwright tests...";

  try {
    const response = await fetch("/api/run-ai-tests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    testOutput.textContent = JSON.stringify(data, null, 2);

    testLinks.innerHTML = `
      <a href="/reports/report.html" target="_blank">Open Summary Report</a>
      <a href="/reports/playwright-report/index.html" target="_blank">Open Playwright Report</a>
    `;
  } catch (error) {
    testOutput.textContent = JSON.stringify(
      {
        ok: false,
        error: error.message
      },
      null,
      2
    );
  } finally {
    runAiTestsBtn.disabled = false;
  }
});