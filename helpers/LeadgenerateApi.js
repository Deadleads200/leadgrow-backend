const OpenAI = require("openai"); 
const fetch = require('node-fetch');

const axios=require('axios')
const getgeminidata = async (apiPayload) => {
  try {
    const { apiKey, category, country, state, limit } = apiPayload;

    if (!apiKey) {
      console.log("Gemini API key missing");
      return [];
    }

    const prompt = `
Generate ${limit} ${category} businesses in ${state}, ${country}.
Return ONLY a valid JSON array.
Each item must include:
name, email, phone, website, city, state, country, postcode, street, openinghours ,lat,lon
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    console.log("Request URL:", url);

    const apiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const result = await apiRes.json();
    console.log('response==', result);

    if (!result?.candidates?.length) {
      console.log("Empty Gemini response");
      return [];
    }
const parts = result?.candidates?.[0]?.content?.parts;

let rawText = parts[0].text.trim();

    if (!rawText) {
      console.log("No text found in Gemini response");
      return [];
    }


    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let leads;
    try {
      leads = JSON.parse(rawText);
    } catch (err) {
      console.log("Invalid JSON from Gemini:", rawText);
      return [];
    }

    // Map API response to backend format
    return leads.map(item => ({
      name: item.name || null,
      email: item.email ? [item.email.toLowerCase()] : [],
      shop: item.commercial?.type || null,
      phone: item.phone ? [item.phone] : [],
      website: item.website || null,
      city: item.city || null,
      state: item.state || state,
      country: item.country || country,
      postcode: item.postcode || null,
      street: item.street || null,
      openinghours: item.openinghours || null,
      lat: item.lat || null,
      lon: item.lon || null,

    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};


const getopenaidata = async (apiPayload) => {
  try {
    const { apiKey, category, country, state, limit } = apiPayload;

    console.log(apiKey, category, country, state, limit);
    
    if (!apiKey) {
      console.log("OpenAI API key missing");
      return [];
    }

    // Create OpenAI client dynamically
    const openai = new OpenAI({ apiKey });

    const prompt = `
Generate ${limit} business leads in JSON format.
Category: ${category}
Location: ${state ? state + ", " : ""}${state}, ${country}
Return ONLY a valid JSON array.
Each lead must include:
name, email, phone, website, city, state, country, postcode, street, openinghours,lat,lon
`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    console.log('api response ',res);
    
    let rawText = res?.choices?.[0]?.message?.content || "";
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    console.log(rawText);
    
    let leads;
    try {
      leads = JSON.parse(rawText);
    } catch (err) {
      console.log("Invalid JSON from OpenAI:", rawText);
      return [];
    }

    return leads.map(item => ({
      name: item.name || null,
      email: item.email ? [item.email.toLowerCase()] : [],
      shop: item.commercial?.type || null,
      phone: item.phone ? [item.phone] : [],
      website: item.website || null,
      city: item.city || null,
      state: item.state || state,
      country: item.country || country,
      postcode: item.postcode || null,
      street: item.street || null,
      openinghours: item.openinghours || null,
      lat: item.lat || null,
      lon: item.lon || null,
    }));

  } catch (error) {
    console.error("OpenAI API Error:", error);
    return [];
  }
};



const getgoogleMapdata = async (apikey) => {
    try {
       return ('getgoogleMapdata')
        
    } catch (error) {
      console.log(error);
        
    }
};


const getgeographydata = async (apiPayload) => {

};

module.exports={ getgeminidata,getopenaidata,getgoogleMapdata,getgeographydata}