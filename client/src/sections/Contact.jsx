import { motion } from "motion/react";
import { useState } from "react";
import { Mail, ArrowUpRight, Send, Check } from "lucide-react";
import { FaLinkedin, FaGithub } from "react-icons/fa";
import GridBg from "../utils/GridBg";
import FloatingParticles from "../utils/FloatingParticles";

function Contact() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle, sending, success, error
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setStatus("error");
      setErrorMsg("All fields are required.");
      return;
    }

    setStatus("sending");
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "https://portfolio-c43c.onrender.com";
      const response = await fetch(`${apiUrl}/api/v1/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", message: "" });
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setErrorMsg(data.message || "Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Failed to connect to the server.");
    }
  };

  const contactCards = [
    {
      title: "Email me",
      value: "swainm099@gmail.com",
      link: "mailto:swainm099@gmail.com",
      icon: <Mail className="text-foreground h-6 w-6" />,
    },
    {
      title: "LinkedIn",
      value: "manash-swain",
      link: "https://www.linkedin.com/in/manash-swain",
      icon: <FaLinkedin className="text-foreground h-6 w-6" />,
    },
    {
      title: "GitHub",
      value: "Manash2005",
      link: "https://github.com/Manash2005",
      icon: <FaGithub className="text-foreground h-6 w-6" />,
    },
  ];

  return (
    <section id="contact" className="relative min-h-screen overflow-hidden pt-20 md:pt-28 pb-16 w-full flex items-center justify-center">
      {/* GRID BACKGROUND */}
      <GridBg />

      {/* FLOATING PARTICLES */}
      <FloatingParticles />

      {/* Ambient Red Glow Backdrop */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[550px] rounded-full bg-foreground/20 blur-3xl z-0 pointer-events-none"
      />

      {/* Large Backdrop Text "CONTACT" */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
        <h1
          className="text-[14vw] font-black text-transparent tracking-widest opacity-[0.02] uppercase font-mono leading-none"
          style={{ WebkitTextStroke: "2px #FFFFFF" }}
        >
          CONTACT
        </h1>
      </div>

      <div className="relative z-10 w-full max-w-7xl px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Side Content & Cards */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-1.5 w-fit text-xs font-mono text-secondary mb-6 backdrop-blur-sm shadow-inner">
              <Mail className="h-3.5 w-3.5 text-foreground" />
              Contact
            </div>

            <h2 className="text-primary text-4xl md:text-5xl font-extrabold tracking-tight">
              Get in touch
            </h2>

            <p className="text-secondary mt-4 mb-8 text-base md:text-lg leading-relaxed max-w-md">
              Have questions, want to collaborate on a project, or just want to connect? Send a message and let's build something great.
            </p>
          </motion.div>

          <div className="space-y-4">
            {contactCards.map((card, idx) => (
              <motion.a
                key={idx}
                href={card.link}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center justify-between border border-white/5 bg-neutral-950/40 backdrop-blur-md rounded-2xl p-5 hover:border-foreground/30 hover:bg-neutral-950/80 transition-all duration-300 group shadow-sm hover:shadow-[0_0_25px_rgba(194,61,41,0.05)]"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/10 border border-white/10 flex justify-center items-center group-hover:scale-105 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs text-secondary font-mono tracking-wider uppercase">{card.title}</p>
                    <p className="text-primary font-semibold text-sm md:text-base mt-0.5">{card.value}</p>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-primary group-hover:bg-foreground group-hover:text-white transition-all duration-300 shadow-sm">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right Side Form */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative border border-white/10 bg-neutral-950/30 backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-10 shadow-[0_0_50px_rgba(194,61,41,0.02)]"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-xs font-mono text-secondary uppercase tracking-wider mb-2">Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  className="w-full bg-neutral-900/30 border border-white/10 focus:border-foreground/50 rounded-xl px-4 py-3.5 text-primary outline-none transition-all duration-300 placeholder:text-neutral-700 focus:shadow-[0_0_15px_rgba(194,61,41,0.08)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-mono text-secondary uppercase tracking-wider mb-2">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@domain.com"
                  className="w-full bg-neutral-900/30 border border-white/10 focus:border-foreground/50 rounded-xl px-4 py-3.5 text-primary outline-none transition-all duration-300 placeholder:text-neutral-700 focus:shadow-[0_0_15px_rgba(194,61,41,0.08)]"
                  required
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-mono text-secondary uppercase tracking-wider mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="w-full bg-neutral-900/30 border border-white/10 focus:border-foreground/50 rounded-xl px-4 py-3.5 text-primary outline-none transition-all duration-300 placeholder:text-neutral-700 resize-none focus:shadow-[0_0_15px_rgba(194,61,41,0.08)]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-500 cursor-pointer flex justify-center items-center gap-2 ${
                  status === "sending"
                    ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed"
                    : "bg-white text-black hover:bg-foreground hover:text-white"
                }`}
              >
                {status === "sending" ? (
                  "Sending..."
                ) : (
                  <>
                    Submit
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Status Alerts */}
              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 p-4 rounded-xl text-sm font-mono mt-4"
                >
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Thank you! Your message has been sent successfully.</span>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded-xl text-sm font-mono mt-4"
                >
                  <span>Error: {errorMsg}</span>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Contact;