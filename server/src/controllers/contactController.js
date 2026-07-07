import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, message) are required.",
      });
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    console.log(`[CONTACT FORM SUBMISSION]`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Message: ${message}`);
    console.log(`-----------------------------------`);

    // Write to a local JSON file to save the contact message
    const messagesFilePath = path.join(__dirname, "../..", "messages.json");
    let messages = [];

    if (fs.existsSync(messagesFilePath)) {
      const fileData = fs.readFileSync(messagesFilePath, "utf8");
      if (fileData) {
        try {
          messages = JSON.parse(fileData);
        } catch (e) {
          console.error("Error parsing existing messages.json, starting fresh", e);
        }
      }
    }

    const newMessage = {
      id: Date.now().toString(),
      name,
      email,
      message,
      submittedAt: new Date().toISOString(),
    };

    messages.push(newMessage);
    fs.writeFileSync(messagesFilePath, JSON.stringify(messages, null, 2), "utf8");

    return res.status(200).json({
      success: true,
      message: "Message received successfully!",
    });
  } catch (error) {
    console.error("Error in submitContactForm:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};
