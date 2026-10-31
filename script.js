"use strict";

/* ===== Data: objects and arrays ===== */
const STORAGE_KEYS = {
  favorites: "northStarFavorites",
  draft: "northStarFormDraft"
};

// Array of objects: the bakery items visitors can save
const products = [
  { id: "breads", name: "Breads", price: "$6 to $10 per loaf" },
  { id: "pastries", name: "Pastries", price: "$3 to $6 each" },
  { id: "cakes", name: "Cakes", price: "$4 to $7 per slice, $35 to $95 whole" },
  { id: "signature-loaf", name: "Signature Loaf", price: "$9 per loaf" }
];

// Object: error messages shown next to fields
const errorMessages = {
  nameRequired: "Please enter your full name.",
  nameShort: "Your name must be at least 2 characters long.",
  emailRequired: "Please enter your email address.",
  emailFormat: "Enter a valid email address, like name@example.com.",
  requestType: "Please choose a request type.",
  pickupRequired: "Please choose a pickup date.",
  pickupPast: "Pickup date cannot be in the past.",
  detailsRequired: "Please tell us which items you would like.",
  detailsShort: "Item details must be at least 10 characters.",
  allergyLong: "Allergy notes must be 300 characters or fewer."
};

let favorites = []; // array of product ids the visitor saved

/* ===== Storage functions ===== */
function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites));
    if (!Array.isArray(saved)) return [];
    return saved.filter(function (id) { return findProduct(id); });
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  } catch (error) {
    console.error("Could not save favorites:", error);
  }
}

/* ===== Product page: favorites feature ===== */
function findProduct(id) {
  return products.find(function (product) { return product.id === id; });
}

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorites = favorites.filter(function (savedId) { return savedId !== id; });
  } else {
    favorites.push(id);
  }
  saveFavorites();
  renderFavorites();
  updateButtons();
}

function clearFavorites() {
  favorites = [];
  saveFavorites();
  renderFavorites();
  updateButtons();
}

function updateButtons() {
  document.querySelectorAll(".fav-btn").forEach(function (button) {
    const product = findProduct(button.dataset.id);
    const saved = isFavorite(button.dataset.id);
    button.textContent = saved ? "Remove from My Pre-Order List" : "Add to My Pre-Order List";
    button.setAttribute("aria-pressed", saved);
    button.setAttribute("aria-label",
      (saved ? "Remove " : "Add ") + product.name + (saved ? " from" : " to") + " my pre-order list");
  });
}

function renderFavorites() {
  const list = document.getElementById("favorites-list");
  const emptyMessage = document.getElementById("favorites-empty");
  const clearButton = document.getElementById("clear-favorites");
  const count = document.getElementById("favorites-count");

  list.innerHTML = "";
  favorites.forEach(function (id) {
    const product = findProduct(id);
    const item = document.createElement("li");
    item.textContent = product.name + " (" + product.price + ")";
    list.appendChild(item);
  });

  emptyMessage.hidden = favorites.length > 0;
  clearButton.hidden = favorites.length === 0;
  count.textContent = favorites.length + (favorites.length === 1 ? " item saved" : " items saved");
}

function initProductsPage() {
  favorites = loadFavorites();
  document.querySelectorAll(".fav-btn").forEach(function (button) {
    button.addEventListener("click", function () { toggleFavorite(button.dataset.id); });
  });
  document.getElementById("clear-favorites").addEventListener("click", clearFavorites);
  renderFavorites();
  updateButtons();
}

/* ===== Contact page: validation ===== */
function getToday() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function validateName(value) {
  if (value.trim() === "") return errorMessages.nameRequired;
  if (value.trim().length < 2) return errorMessages.nameShort;
  return "";
}

function validateEmail(value) {
  if (value.trim() === "") return errorMessages.emailRequired;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) return errorMessages.emailFormat;
  return "";
}

function validateRequestType(value) {
  return value === "" ? errorMessages.requestType : "";
}

function validatePickupDate(value) {
  if (value === "") return errorMessages.pickupRequired;
  if (value < getToday()) return errorMessages.pickupPast;
  return "";
}

function validateItemDetails(value) {
  if (value.trim() === "") return errorMessages.detailsRequired;
  if (value.trim().length < 10) return errorMessages.detailsShort;
  return "";
}

function validateAllergies(value) {
  return value.length > 300 ? errorMessages.allergyLong : "";
}

// Array of objects: which check belongs to which field
const fieldRules = [
  { id: "name", check: validateName },
  { id: "email", check: validateEmail },
  { id: "request-type", check: validateRequestType },
  { id: "pickup-date", check: validatePickupDate },
  { id: "item-details", check: validateItemDetails },
  { id: "allergies", check: validateAllergies }
];

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(fieldId + "-error");
  error.textContent = message;
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", fieldId + "-error");
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  document.getElementById(fieldId + "-error").textContent = "";
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
}

function validateField(rule) {
  const message = rule.check(document.getElementById(rule.id).value);
  if (message) {
    showError(rule.id, message);
    return false;
  }
  clearError(rule.id);
  return true;
}

function validateForm() {
  let firstInvalid = null;
  fieldRules.forEach(function (rule) {
    if (!validateField(rule) && firstInvalid === null) firstInvalid = rule.id;
  });
  if (firstInvalid) document.getElementById(firstInvalid).focus();
  return firstInvalid === null;
}

/* ===== Contact page: storage (draft + pre-fill) ===== */
function saveDraft() {
  const draft = {};
  fieldRules.forEach(function (rule) {
    draft[rule.id] = document.getElementById(rule.id).value;
  });
  try {
    localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
  } catch (error) {
    console.error("Could not save draft:", error);
  }
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(STORAGE_KEYS.draft));
    if (!draft) return;
    fieldRules.forEach(function (rule) {
      if (draft[rule.id] !== undefined) document.getElementById(rule.id).value = draft[rule.id];
    });
  } catch (error) {
    console.error("Could not load draft:", error);
  }
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEYS.draft); } catch (error) { /* ignore */ }
}

function prefillFromFavorites() {
  const note = document.getElementById("favorites-note");
  if (favorites.length === 0) return;

  const names = favorites.map(function (id) { return findProduct(id).name; });
  const details = document.getElementById("item-details");
  note.textContent = "Your saved pre-order list: " + names.join(", ") + ".";
  note.hidden = false;

  if (details.value.trim() === "") {
    details.value = "Pre-order list: " + names.join(", ");
    saveDraft();
  }
}

function showSuccess() {
  const name = document.getElementById("name").value.trim();
  const box = document.getElementById("form-message");
  box.textContent = "Thank you, " + name + "! Your request was received. We'll reply within one business day.";
  box.hidden = false;
  box.focus();
}

function handleSubmit(event) {
  event.preventDefault(); // always stop the page from reloading
  const box = document.getElementById("form-message");
  box.hidden = true;
  if (!validateForm()) return; // invalid: keep what the user typed so they can fix it
  showSuccess();
  clearDraft();
}

function handleReset() {
  fieldRules.forEach(function (rule) { clearError(rule.id); });
  document.getElementById("form-message").hidden = true;
  clearDraft();
}

function initContactPage() {
  favorites = loadFavorites();
  const form = document.getElementById("preorder-form");

  document.getElementById("pickup-date").min = getToday();
  loadDraft();
  prefillFromFavorites();

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("reset", handleReset);

  fieldRules.forEach(function (rule) {
    const field = document.getElementById(rule.id);
    field.addEventListener("blur", function () { validateField(rule); });
    field.addEventListener("input", function () {
      saveDraft();
      if (field.getAttribute("aria-invalid") === "true") validateField(rule);
    });
  });
}

/* ===== Start the right code for the current page ===== */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("favorites-list")) initProductsPage();
  if (document.getElementById("preorder-form")) initContactPage();
});