const enquiry = document.getElementById("vu-enquiry");
const result = document.getElementById("vu-enquiry-result");
const message = document.getElementById("vu-enquiry-text");
const copy = document.getElementById("vu-enquiry-copy");
const status = document.getElementById("vu-enquiry-status");

enquiry.addEventListener("submit", event => {
  event.preventDefault();
  const fields = new FormData(enquiry);
  const labels = {customer:"Name", service:"Service", mode:"Venue mode", when:"Preferred date and time", guests:"Guests", requests:"Requests"};
  const details = Object.entries(labels).flatMap(([key, label]) => {
    const value = fields.get(key).trim();
    return value ? [label + ": " + value] : [];
  });
  message.value = ["Vanilla Unicorn enquiry", ...details].join("\n");
  result.hidden = copy.hidden = false;
  status.textContent = "Your enquiry is ready to copy and send in city.";
  message.focus();
});
enquiry.addEventListener("input", () => {
  result.hidden = copy.hidden = true;
  status.textContent = "";
});
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    status.textContent = "Enquiry copied. Send it to 210 - 3432 in city.";
  } catch {
    message.focus();
    message.select();
    status.textContent = "Copy the selected message and send it to 210 - 3432 in city.";
  }
});
