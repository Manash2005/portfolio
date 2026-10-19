import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { API_BASE_URL } from '../../utils/apiConfig'
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Trophy,
  Calendar,
  Check,
  Copy,
  AlertCircle,
  Lightbulb,
  Code2,
  Terminal,
  HelpCircle,
  Zap,
  Flame,
  Award,
  Layers,
  Cpu,
  Database,
  Globe,
} from 'lucide-react'

const COURSE_THEMES = {
  'OS': {
    name: 'Operating Systems',
    color: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.15)',
    border: 'rgba(0, 240, 255, 0.3)',
    icon: Cpu,
    tagline: 'Kernel, Processes, Threads, Memory & Deadlocks',
  },
  'DBMS': {
    name: 'DBMS & SQL',
    color: '#10B981',
    glow: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: Database,
    tagline: 'ACID, Indexing, Transactions & SQL Query Mastery',
  },
  'CN': {
    name: 'Computer Networks',
    color: '#38BDF8',
    glow: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: Globe,
    tagline: 'TCP/IP, OSI Layers, DNS, HTTP/3 & Sockets',
  },
  'System Design': {
    name: 'System Design (HLD)',
    color: '#B8FF3C',
    glow: 'rgba(184, 255, 60, 0.15)',
    border: 'rgba(184, 255, 60, 0.3)',
    icon: Layers,
    tagline: 'CAP Theorem, Sharding, Caching & Scalability',
  },
  'OOPs': {
    name: 'OOPs & LLD',
    color: '#C084FC',
    glow: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.3)',
    icon: Code2,
    tagline: 'Design Patterns, SOLID Principles & Polymorphism',
  },
}

export default function CourseAcademyWorkspace({ onSwitchToDrill, onSwitchToCalendar, onActivityReward }) {
  // Course listing & selection
  const [courses, setCourses] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('OS')
  const [curriculum, setCurriculum] = useState(null)
  const [coursesLoading, setCoursesLoading] = useState(true)

  // Current Lesson state
  const [currentLessonId, setCurrentLessonId] = useState(null)
  const [lessonDetail, setLessonDetail] = useState(null)
  const [lessonLoading, setLessonLoading] = useState(false)

  // Collapsible modules state
  const [expandedModules, setExpandedModules] = useState({})

  // Assignment / Quiz submission state
  const [studentAnswers, setStudentAnswers] = useState({}) // { [question_id]: selected_option_idx }
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)
  const [assignmentResult, setAssignmentResult] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedDiagram, setCopiedDiagram] = useState(false)

  const lessonTopRef = useRef(null)

  // 1. Fetch all courses
  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/courses`)
      const data = await res.json()
      if (data.success && data.courses) {
        setCourses(data.courses)
      }
    } catch (err) {
      console.error('Failed to load courses:', err)
    } finally {
      setCoursesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // 2. Fetch selected course curriculum
  const fetchCurriculum = useCallback(async (subjectKey) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/courses/${encodeURIComponent(subjectKey)}`)
      const data = await res.json()
      if (data.success && data.course) {
        setCurriculum(data.course)

        // Expand all modules by default
        const exp = {}
        data.course.modules?.forEach((m) => {
          exp[m.id] = true
        })
        setExpandedModules(exp)

        // Select the first lesson if none currently selected or subject changed
        if (data.course.modules?.length > 0) {
          const firstModule = data.course.modules[0]
          if (firstModule.lessons?.length > 0) {
            // Find first incomplete lesson, or default to first lesson
            const firstIncomplete = firstModule.lessons.find((l) => l.is_quiz_passed !== 1)
            const targetLesson = firstIncomplete || firstModule.lessons[0]
            setCurrentLessonId(targetLesson.id)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load curriculum:', err)
    }
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      fetchCurriculum(selectedSubject)
    }
  }, [selectedSubject, fetchCurriculum])

  // 3. Fetch Lesson detail when currentLessonId changes
  const fetchLesson = useCallback(async (lessonId) => {
    if (!lessonId) return
    setLessonLoading(true)
    setAssignmentResult(null)
    setStudentAnswers({})
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/lessons/${lessonId}`)
      const data = await res.json()
      if (data.success && data.lesson) {
        setLessonDetail(data.lesson)
      }
    } catch (err) {
      console.error('Failed to load lesson detail:', err)
    } finally {
      setLessonLoading(false)
      // Scroll smoothly to top of lesson container
      lessonTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => {
    if (currentLessonId) {
      fetchLesson(currentLessonId)
    }
  }, [currentLessonId, fetchLesson])

  // Toggle Module accordion
  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }))
  }

  // Handle student selecting quiz option
  const handleSelectOption = (questionId, optionIdx) => {
    if (assignmentResult?.passed) return // locked once passed
    setStudentAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }))
  }

  // Submit assignment answers
  const handleSubmitAssignment = async () => {
    if (!lessonDetail || !lessonDetail.assignments || lessonDetail.assignments.length === 0) return

    // Ensure all questions are answered
    const unanswered = lessonDetail.assignments.filter((q) => studentAnswers[q.id] === undefined)
    if (unanswered.length > 0) {
      alert(`Please answer all ${lessonDetail.assignments.length} questions before submitting!`)
      return
    }

    setAssignmentSubmitting(true)
    try {
      const answersPayload = Object.entries(studentAnswers).map(([qid, optIdx]) => ({
        question_id: qid,
        selected_option_idx: optIdx,
      }))

      const res = await fetch(`${API_BASE_URL}/api/v1/core-cs/lessons/${lessonDetail.id}/submit-assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersPayload }),
      })

      const data = await res.json()
      if (data.success) {
        setAssignmentResult(data)

        // If passed, notify parent to trigger gamification toast/refresh
        if (data.passed && onActivityReward) {
          onActivityReward({
            xp: data.xp_earned || 50,
            title: `Completed: ${lessonDetail.title}`,
            message: `Scored ${data.score}%! Spaced revision scheduled in Second Brain Calendar.`,
          })
        }

        // Refresh curriculum progress
        fetchCurriculum(selectedSubject)
        fetchCourses()
      } else {
        alert(data.error || 'Failed to submit assignment')
      }
    } catch (err) {
      console.error('Error submitting assignment:', err)
      alert('Network error while grading assignment')
    } finally {
      setAssignmentSubmitting(false)
    }
  }

  // Reset quiz attempt
  const handleRetryQuiz = () => {
    setAssignmentResult(null)
    setStudentAnswers({})
  }

  // Copy helper
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'code') {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else {
      setCopiedDiagram(true)
      setTimeout(() => setCopiedDiagram(false), 2000)
    }
  }

  const currentTheme = COURSE_THEMES[selectedSubject] || COURSE_THEMES['OS']
  const IconComponent = currentTheme.icon

  return (
    <div className="w-full text-[#EDEDF2] space-y-6 select-text" ref={lessonTopRef}>
      {/* 1. Subject Selector Cards (Coursera / Udemy Academy Bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(COURSE_THEMES).map(([subKey, theme]) => {
          const SubIcon = theme.icon
          const isSelected = selectedSubject === subKey
          const courseData = courses.find((c) => c.subject === subKey)

          return (
            <button
              key={subKey}
              onClick={() => setSelectedSubject(subKey)}
              style={{
                borderColor: isSelected ? theme.border : 'rgba(255,255,255,0.06)',
                backgroundColor: isSelected ? theme.glow : 'rgba(14,14,20,0.8)',
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer hover:border-white/20 ${
                isSelected ? 'shadow-lg' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: theme.glow,
                    borderColor: theme.border,
                    color: theme.color,
                  }}
                >
                  <SubIcon className="w-4 h-4" />
                </div>

                {courseData && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    style={{
                      backgroundColor: courseData.progressPercent === 100 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                      color: courseData.progressPercent === 100 ? '#10B981' : '#8A8A99',
                    }}
                  >
                    {courseData.progressPercent}%
                  </span>
                )}
              </div>

              <h3 className="text-xs font-bold font-display text-white group-hover:text-cyan-400 transition-colors truncate">
                {theme.name}
              </h3>

              <p className="text-[10px] text-[#8A8A99] font-mono truncate mt-0.5">
                {courseData ? `${courseData.completedLessons || 0}/${courseData.totalLessons || 0} Lessons` : 'Curated Course'}
              </p>

              {/* Progress track */}
              <div className="w-full h-1 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${courseData?.progressPercent || 0}%`,
                    backgroundColor: theme.color,
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* 2. Course Hero & Curriculum Overview Header */}
      {curriculum && (
        <div
          className="p-5 sm:p-6 rounded-2xl border bg-[#0E0E14] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderColor: currentTheme.border }}
        >
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                style={{ backgroundColor: currentTheme.glow, color: currentTheme.color }}
              >
                {curriculum.subject} Mastery Academy
              </span>
              <span className="text-xs text-[#8A8A99] font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{curriculum.estimated_hours || 10} Hours
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              {curriculum.title}
            </h1>

            <p className="text-xs sm:text-sm text-[#8A8A99] leading-relaxed">
              {curriculum.description}
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[#8A8A99]">Modules:</span>
              <strong className="text-white">{curriculum.modules?.length || 0}</strong>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[#8A8A99]">Progress:</span>
              <strong style={{ color: currentTheme.color }}>
                {curriculum.completedLessons} / {curriculum.totalLessons} ({curriculum.progressPercent}%)
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace: Split-Screen Course Syllabus (Left) + Interactive Lesson Classroom (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Syllabus Tree Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-xl">
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Course Syllabus</span>
              </div>
              <span className="text-[11px] font-mono text-[#8A8A99]">
                {curriculum?.modules?.length || 0} Modules
              </span>
            </div>

            {/* Modules Accordion List */}
            <div className="space-y-3">
              {curriculum?.modules?.map((module, mIdx) => {
                const isExpanded = expandedModules[module.id] !== false
                const completedCount = module.lessons?.filter((l) => l.is_quiz_passed === 1).length || 0
                const totalLessons = module.lessons?.length || 0

                return (
                  <div
                    key={module.id}
                    className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden"
                  >
                    {/* Module Accordion Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full p-3 flex items-center justify-between gap-2 text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-[#8A8A99]">
                            Module {module.module_number}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {completedCount}/{totalLessons} passed
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate">{module.title}</h4>
                      </div>

                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#8A8A99] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#8A8A99] shrink-0" />
                      )}
                    </button>

                    {/* Module Lessons List */}
                    {isExpanded && (
                      <div className="p-2 space-y-1 bg-black/20 border-t border-white/5">
                        {module.lessons?.map((lesson, lIdx) => {
                          const isCurrent = lesson.id === currentLessonId
                          const isPassed = lesson.is_quiz_passed === 1

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => setCurrentLessonId(lesson.id)}
                              className={`w-full p-2.5 rounded-lg flex items-center justify-between gap-2 text-left text-xs transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-purple-500/15 border border-purple-500/40 text-white font-semibold'
                                  : isPassed
                                  ? 'hover:bg-white/5 text-[#EDEDF2]'
                                  : 'hover:bg-white/5 text-[#8A8A99]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {isPassed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : isCurrent ? (
                                  <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-white/20 shrink-0 ml-1 mr-1" />
                                )}

                                <div className="truncate">
                                  <span className="truncate block">{lesson.title}</span>
                                  <span className="text-[10px] font-mono text-[#8A8A99]">
                                    {lesson.reading_time_minutes} min read
                                  </span>
                                </div>
                              </div>

                              {isPassed && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                  Passed
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Study Aids Link / Flashcard review shortcut */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10 border border-purple-500/20 text-xs font-mono space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Active Recall Spaced Review</span>
            </div>
            <p className="text-[11px] text-[#8A8A99] leading-relaxed">
              Passed assignments are automatically scheduled in your Second Brain Calendar for active recall drills.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onSwitchToDrill}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer font-semibold flex items-center gap-1.5"
              >
                <span>Drill Flashcards</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              {onSwitchToCalendar && (
                <button
                  onClick={onSwitchToCalendar}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#EDEDF2] border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  <span>Calendar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Lesson Classroom Pane (8 cols) */}
        <div className="lg:col-span-8">
          {lessonLoading ? (
            <div className="p-12 rounded-2xl bg-[#0E0E14] border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <p className="text-xs font-mono text-[#8A8A99]">Loading interactive lesson curriculum...</p>
            </div>
          ) : lessonDetail ? (
            <div className="space-y-6">
              {/* Lesson Hero Banner */}
              <div className="p-6 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: currentTheme.glow, color: currentTheme.color }}
                    >
                      {lessonDetail.subject}
                    </span>
                    <span className="text-[#8A8A99]">•</span>
                    <span className="text-[#8A8A99]">{lessonDetail.module_title}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[#8A8A99] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {lessonDetail.reading_time_minutes} min read
                    </span>

                    {lessonDetail.is_quiz_passed === 1 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Assignment Passed ({lessonDetail.quiz_score}%)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        Assignment Pending
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold font-display text-white">
                  {lessonDetail.title}
                </h2>
              </div>

              {/* SECTION 1: Real-World Analogy (Beginner-Friendly Foundation) */}
              {lessonDetail.analogy_title && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#0E0E14] to-cyan-500/5 border border-amber-500/30 shadow-lg relative overflow-hidden">
                  <div className="flex items-center gap-2.5 text-amber-400 font-bold font-mono text-xs uppercase tracking-wider mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-300" />
                    <span>Real-World Analogy: {lessonDetail.analogy_title}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed font-sans italic">
                    "{lessonDetail.analogy_markdown}"
                  </p>
                </div>
              )}

              {/* SECTION 2: In-Depth Conceptual Architecture & Mechanics */}
              <div className="p-6 sm:p-7 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Core Theory & Mechanics</span>
                </div>

                <div className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed font-sans space-y-4 whitespace-pre-line">
                  {lessonDetail.content_markdown}
                </div>
              </div>

              {/* SECTION 3: ASCII Architecture & Flow Diagram */}
              {lessonDetail.diagram_ascii && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#09090D] border border-white/10 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#B8FF3C] uppercase tracking-wider">
                      <Terminal className="w-4 h-4 text-[#B8FF3C]" />
                      <span>Architecture Diagram & Data Flow</span>
                    </div>

                    <button
                      onClick={() => handleCopy(lessonDetail.diagram_ascii, 'diagram')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/5 hover:bg-white/10 text-[#8A8A99] hover:text-white transition-colors cursor-pointer flex items-center gap-1 border border-white/5"
                    >
                      {copiedDiagram ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDiagram ? 'Copied' : 'Copy Diagram'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/60 border border-white/5 overflow-x-auto font-mono text-[11px] sm:text-xs text-cyan-300 leading-normal">
                    {lessonDetail.diagram_ascii}
                  </pre>
                </div>
              )}

              {/* SECTION 4: Concrete Code Snippet / SQL Implementation */}
              {lessonDetail.code_snippet && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#09090D] border border-white/10 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span>Implementation ({lessonDetail.code_language || 'Code'})</span>
                    </div>

                    <button
                      onClick={() => handleCopy(lessonDetail.code_snippet, 'code')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-white/5 hover:bg-white/10 text-[#8A8A99] hover:text-white transition-colors cursor-pointer flex items-center gap-1 border border-white/5"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-black/60 border border-white/5 overflow-x-auto font-mono text-[11px] sm:text-xs text-[#E5E7EB] leading-normal">
                    {lessonDetail.code_snippet}
                  </pre>
                </div>
              )}

              {/* SECTION 5: Key Takeaways & Interview Gotchas */}
              {lessonDetail.key_takeaways && lessonDetail.key_takeaways.length > 0 && (
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0E0E14] border border-white/5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider pb-2 border-b border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>High-Yield Interview Takeaways</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {lessonDetail.key_takeaways.map((point, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-[#EDEDF2]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 6: Coursera / Udemy Style Interactive Graded Assignment */}
              {lessonDetail.assignments && lessonDetail.assignments.length > 0 && (
                <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-[#12121C] via-[#0E0E14] to-[#0A0A10] border border-purple-500/30 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-bold font-display text-white">
                          Lesson Graded Assignment
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {lessonDetail.assignments.length} Questions
                        </span>
                      </div>
                      <p className="text-xs text-[#8A8A99] font-mono">
                        Score ≥ 80% to earn <strong className="text-amber-300">+50 XP</strong> & schedule active recall in Calendar.
                      </p>
                    </div>

                    {assignmentResult && (
                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                          assignmentResult.passed
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {assignmentResult.passed ? (
                          <>
                            <Trophy className="w-4 h-4 text-emerald-400" />
                            <span>Passed: {assignmentResult.score}%</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span>Score: {assignmentResult.score}% (Requires 80%)</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Questions List */}
                  <div className="space-y-6">
                    {lessonDetail.assignments.map((assignment, qIdx) => {
                      const gradedQuestion = assignmentResult?.results?.find((r) => r.question_id === assignment.id)
                      const selectedOptionIdx = studentAnswers[assignment.id]

                      return (
                        <div
                          key={assignment.id}
                          className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/5 space-y-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-white leading-relaxed">
                              {assignment.question}
                            </h4>
                          </div>

                          {/* Options */}
                          <div className="space-y-2.5 pl-9">
                            {assignment.options?.map((optText, optIdx) => {
                              const isSelected = selectedOptionIdx === optIdx
                              let optionStyles = 'border-white/5 bg-white/[0.02] text-[#EDEDF2] hover:bg-white/[0.05]'

                              // Post-grading styles
                              if (gradedQuestion) {
                                const isCorrectChoice = optIdx === gradedQuestion.correct_option_idx
                                const isStudentChoice = optIdx === gradedQuestion.selected_option_idx

                                if (isCorrectChoice) {
                                  optionStyles = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-semibold'
                                } else if (isStudentChoice && !isCorrectChoice) {
                                  optionStyles = 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                                } else {
                                  optionStyles = 'border-white/5 bg-white/[0.01] text-[#8A8A99] opacity-60'
                                }
                              } else if (isSelected) {
                                optionStyles = 'border-purple-500/50 bg-purple-500/20 text-white font-semibold shadow-md'
                              }

                              return (
                                <button
                                  key={optIdx}
                                  disabled={assignmentResult?.passed}
                                  onClick={() => handleSelectOption(assignment.id, optIdx)}
                                  className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${optionStyles}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        isSelected || (gradedQuestion && optIdx === gradedQuestion.selected_option_idx)
                                          ? 'border-purple-400 bg-purple-500'
                                          : 'border-white/20'
                                      }`}
                                    >
                                      {(isSelected || (gradedQuestion && optIdx === gradedQuestion.selected_option_idx)) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                      )}
                                    </div>
                                    <span>{optText}</span>
                                  </div>

                                  {gradedQuestion && optIdx === gradedQuestion.correct_option_idx && (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                                      Correct
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {/* Post-grading explanation */}
                          {gradedQuestion && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="ml-9 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-[#D1D5DB] space-y-1 font-mono"
                            >
                              <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Explanation & Core Takeaway:</span>
                              </div>
                              <p className="leading-relaxed">{gradedQuestion.explanation}</p>
                            </motion.div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Assignment Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="text-xs font-mono text-[#8A8A99]">
                      {!assignmentResult ? (
                        <span>
                          Answered: {Object.keys(studentAnswers).length} / {lessonDetail.assignments.length}
                        </span>
                      ) : assignmentResult.passed ? (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Mastery achieved! Spaced revision scheduled for 2 days from now.
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          Need ≥ 80% to pass. Review the lesson explanations and try again!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {assignmentResult && !assignmentResult.passed && (
                        <button
                          onClick={handleRetryQuiz}
                          className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                      )}

                      {!assignmentResult ? (
                        <button
                          onClick={handleSubmitAssignment}
                          disabled={assignmentSubmitting}
                          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                        >
                          {assignmentSubmitting ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            <Award className="w-4 h-4 text-amber-300" />
                          )}
                          <span>Submit Assignment</span>
                        </button>
                      ) : assignmentResult.passed && lessonDetail.nextLesson ? (
                        <button
                          onClick={() => setCurrentLessonId(lessonDetail.nextLesson.id)}
                          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none"
                        >
                          <span>Next Lesson: {lessonDetail.nextLesson.title}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {/* Prev / Next Bottom Navigation Bar */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#0E0E14] border border-white/5">
                {lessonDetail.prevLesson ? (
                  <button
                    onClick={() => setCurrentLessonId(lessonDetail.prevLesson.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#8A8A99] hover:text-white bg-white/[0.02] hover:bg-white/5 border border-white/5 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px] sm:max-w-xs">{lessonDetail.prevLesson.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                {lessonDetail.nextLesson && (
                  <button
                    onClick={() => setCurrentLessonId(lessonDetail.nextLesson.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="truncate max-w-[150px] sm:max-w-xs">{lessonDetail.nextLesson.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-[#0E0E14] border border-white/5 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-[#8A8A99] mx-auto" />
              <h3 className="text-base font-bold text-white">Select a lesson to begin learning</h3>
              <p className="text-xs text-[#8A8A99] font-mono">
                Choose any module and lesson from the curriculum sidebar on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
