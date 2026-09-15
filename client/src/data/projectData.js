export const projects = [
  {
    title: "Gatekeeper",
    category: "web",
    description:
      "A secure agentic AI workflow: the LLM proposes actions via Anthropic Tool Use, but a deterministic rules-engine gates every critical operation. Achieved 0% hallucinated execution rate and 99% structured-output parse success using Pydantic schemas.",
    image: "/projects/gatekeeper.png",
    liveLink: "https://revenue-recovery-jet.vercel.app/",
    githubLink: "https://github.com/Manash2005/revenue_recovery",
    techStack: ["Python", "FastAPI", "Anthropic API", "Pydantic", "Agentic Design"],
  },
  {
    title: "TaskFlow",
    category: "web",
    description:
      "A full-stack task management application featuring user authentication, drag-and-drop Kanban boards, real-time analytics dashboards, and complete profile customisations.",
    image: "/projects/taskflow.png",
    liveLink: "https://task-manager-phi-five-12.vercel.app/",
    githubLink: "https://github.com/manash/taskflow",
    techStack: ["React", "Node.js", "Express", "MongoDB", "TailwindCSS", "JavaScript"],
  },

  {
    title: "Socially",
    category: "web",
    description:
      "A private organizational social network where authenticated users can share text/image posts, follow colleagues, and collaborate in secure, restricted department-level channels.",
    image: "/projects/socially.png",
    liveLink: "https://socially.vercel.app",
    githubLink: "", // Hidden when empty
    techStack: ["React", "Node.js", "Supabase", "TailwindCSS", "JavaScript"],
  },

  {
    title: "EduPredict: Student Performance Analytics",
    category: "data-analytics",
    description:
      "A predictive data analytics dashboard analyzing student engagement metrics and academic performance. Performs feature engineering, correlation analysis, and renders multi-variable distribution plots.",
    image: "/projects/edupredict.png",
    liveLink: "",
    githubLink: "https://github.com/Manash2005/student-performance-analysis",
    techStack: ["Python", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter"],
  },
];