const cleanLeadForExport = (item) => ({
  Name: item.Name || item.name || "",
  Email: Array.isArray(item.Email || item.email)
    ? (item.Email || item.email).join("; ")
    : (item.Email || item.email || ""),
  Phone: Array.isArray(item.Phone || item.phone)
    ? (item.Phone || item.phone).join("; ")
    : (item.Phone || item.phone || ""),
  Website: item.Website || item.website || "",
  City: item.City || item.city || "",
  State: item.State || item.state || "",
  Country: item.Country || item.country || "",
  Postcode: item.Postcode || item.postcode || "",
  Street: item.Street || item.street || "",
  OpeningHours: item.OpeningHours || item.openinghours || ""
});

module.exports = {
  cleanLeadForExport
};