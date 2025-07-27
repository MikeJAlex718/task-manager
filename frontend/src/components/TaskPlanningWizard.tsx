import React, { useState } from 'react';
import { Brain, Calendar, Clock, BookOpen, Target, CheckCircle, AlertCircle, Lightbulb, Users, TrendingUp, Wand2, XCircle } from 'lucide-react';

interface TaskPlanningStep {
  id: string;
  title: string;
  description: string;
  estimated_time: number; // in hours
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: string[];
  tips: string[];
  dependencies?: string[]; // IDs of steps that must be completed first
}

interface TaskPlan {
  task_id: string;
  title: string;
  subject: string;
  assignment_type: string;
  due_date: string;
  urgency_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  total_estimated_time: number;
  steps: TaskPlanningStep[];
  study_schedule: {
    daily_goals: string[];
    weekly_milestones: string[];
    time_management: string;
  };
  resources: {
    title: string;
    description: string;
    url?: string;
  }[];
  tips: string[];
  subject_specific_advice: string;
}

interface TaskPlanningWizardProps {
  taskData: {
    title: string;
    description: string;
    subject: string;
    assignment_type: string;
    due_date: string;
  };
  onApplyPlan: (plan: TaskPlan) => void;
  onClose: () => void;
}

const TaskPlanningWizard: React.FC<TaskPlanningWizardProps> = ({ taskData, onApplyPlan, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generateComprehensivePlan = async () => {
    setLoading(true);
    
    try {
      // Calculate urgency level based on due date
      const daysUntilDue = taskData.due_date ? 
        Math.ceil((new Date(taskData.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        null;
      
      const urgencyLevel = daysUntilDue !== null ? 
        (daysUntilDue <= 1 ? 'CRITICAL' : daysUntilDue <= 3 ? 'HIGH' : daysUntilDue <= 7 ? 'MEDIUM' : 'LOW') : 
        'MEDIUM';

      // Generate subject-specific advice
      const subjectAdvice = generateSubjectAdvice(taskData.subject, taskData.assignment_type);
      
      // Generate study steps based on assignment type and urgency
      const steps = generateStudySteps(taskData.assignment_type, urgencyLevel, daysUntilDue);
      
      // Calculate total estimated time
      const totalEstimatedTime = steps.reduce((total, step) => total + step.estimated_time, 0);
      
      // Generate study schedule
      const study_schedule = generateStudySchedule(steps, daysUntilDue, urgencyLevel);
      
      // Generate resources
      const resources = generateResources(taskData.subject, taskData.assignment_type);
      
      // Generate tips
      const tips = generateTips(urgencyLevel, taskData.assignment_type, daysUntilDue);
      
      const comprehensivePlan: TaskPlan = {
        task_id: 'temp-id',
        title: taskData.title,
        subject: taskData.subject,
        assignment_type: taskData.assignment_type,
        due_date: taskData.due_date,
        urgency_level: urgencyLevel,
        total_estimated_time: totalEstimatedTime,
        steps,
        study_schedule: study_schedule,
        resources,
        tips,
        subject_specific_advice: subjectAdvice
      };
      
      setPlan(comprehensivePlan);
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSubjectAdvice = (subject: string, assignmentType: string): string => {
    const subjectAdvice: { [key: string]: { [key: string]: string } } = {
      'Mathematics': {
        'Exam': `📐 MATHEMATICS EXAM STRATEGY:\n\n🎯 Focus Areas:\n• Master fundamental formulas and theorems - create a formula sheet\n• Practice solving problems under time pressure (set 20-min timers)\n• Review past exams and identify recurring problem types\n• Work through textbook examples without looking at solutions first\n\n💡 Problem-Solving Approach:\n• Read each problem twice before starting\n• Identify what type of problem it is (algebraic, geometric, calculus, etc.)\n• Write down given information and what you need to find\n• Show all work step-by-step for partial credit\n• Check your answers by substituting back into original equations\n\n⚠️ Common Pitfalls to Avoid:\n• Rushing through calculation steps\n• Forgetting to check units in word problems\n• Not simplifying final answers\n• Skipping steps in proofs`,
        
        'Homework': `📚 MATHEMATICS HOMEWORK MASTERY:\n\n🔍 Step-by-Step Process:\n• Start by reviewing relevant lecture notes and textbook sections\n• Work through similar examples before attempting assigned problems\n• Use online tools like Wolfram Alpha to verify your solutions\n• Practice each type of problem until you can do it without help\n\n💻 Technology Integration:\n• Use Desmos for graphing functions and visualizing problems\n• Khan Academy for additional practice problems\n• YouTube channels like Professor Leonard for detailed explanations\n• Photomath app to check your work (but understand the steps!)\n\n📝 Organization Tips:\n• Keep a dedicated math notebook with clear problem layouts\n• Write out each step clearly - don't skip mental math\n• Create a personal "error log" to track mistakes you commonly make\n• Review homework before class to prepare questions for your teacher`,
        
        'Project': `🏗️ MATHEMATICS PROJECT FRAMEWORK:\n\n📋 Project Planning Phase:\n• Clearly define the mathematical problem or research question\n• Research real-world applications of the mathematical concepts\n• Gather data sources and determine what calculations are needed\n• Create a timeline with specific milestones\n\n🔬 Implementation Strategy:\n• Start with simplified models before adding complexity\n• Use mathematical software like MATLAB, Python, or Excel for calculations\n• Document all assumptions and limitations of your model\n• Create clear visualizations (graphs, charts) to illustrate findings\n\n📊 Presentation Excellence:\n• Explain mathematical concepts in accessible language\n• Include real-world context and applications\n• Show your problem-solving process, not just final answers\n• Prepare for questions about your methodology and assumptions`,
        
        'Essay': `✍️ MATHEMATICS ESSAY EXCELLENCE:\n\n📖 Content Development:\n• Focus on the historical development and applications of mathematical concepts\n• Explore connections between different areas of mathematics\n• Discuss how mathematical theories solve real-world problems\n• Include biographical information about key mathematicians\n\n🎯 Structure and Flow:\n• Introduction: Hook with a fascinating mathematical fact or application\n• Body: Logical progression from basic concepts to advanced applications\n• Use examples and analogies to make abstract concepts concrete\n• Conclusion: Reflect on the broader impact of mathematics on society\n\n📚 Research Strategy:\n• Use academic sources like Mathematical Reviews and JSTOR\n• Include primary sources from famous mathematicians when possible\n• Verify mathematical facts and historical claims\n• Balance technical accuracy with readability for your audience`
      },
      
      'Computer Science': {
        'Exam': `💻 COMPUTER SCIENCE EXAM MASTERY:\n\n🧠 Core Preparation Areas:\n• Algorithm analysis: Practice Big O notation and complexity calculations\n• Data structures: Implement arrays, linked lists, trees, graphs from scratch\n• Coding problems: Solve 2-3 LeetCode problems daily leading up to exam\n• System design: Understand scalability, databases, and architecture patterns\n\n⌨️ Coding Excellence:\n• Practice writing code by hand (no IDE assistance)\n• Time yourself solving algorithmic problems\n• Review common coding patterns (two pointers, sliding window, etc.)\n• Understand debugging techniques and edge case handling\n\n🔍 Conceptual Understanding:\n• Don't just memorize - understand WHY algorithms work\n• Be able to trace through code execution step by step\n• Know when to use different data structures\n• Understand trade-offs between time and space complexity`,
        
        'Homework': `👨‍💻 COMPUTER SCIENCE HOMEWORK STRATEGY:\n\n🎯 Problem Decomposition:\n• Read the entire assignment before writing any code\n• Break complex problems into smaller, testable functions\n• Write pseudocode first to organize your logic\n• Start with the simplest possible solution, then optimize\n\n🛠️ Development Best Practices:\n• Use version control (Git) to track your progress\n• Write meaningful variable names and comments\n• Test your code with edge cases and invalid inputs\n• Follow the style guide specified by your instructor\n\n🔧 Debugging Mastery:\n• Use print statements or debugger to trace execution\n• Test functions individually before integrating\n• Create test cases that cover normal, edge, and error conditions\n• Don't be afraid to rewrite code if the logic is unclear\n\n📚 Learning Resources:\n• Stack Overflow for specific coding questions\n• GitHub for code examples and project inspiration\n• Documentation for the programming language you're using\n• Online compilers for quick testing without setup`,
        
        'Project': `🚀 COMPUTER SCIENCE PROJECT DEVELOPMENT:\n\n📋 Planning and Architecture:\n• Define clear requirements and user stories\n• Choose appropriate technologies and frameworks\n• Design your system architecture before coding\n• Set up development environment and project structure\n\n💡 Implementation Strategy:\n• Follow agile development principles\n• Build a minimum viable product (MVP) first\n• Implement core functionality before adding features\n• Write tests as you develop (test-driven development)\n\n🔄 Version Control and Collaboration:\n• Make frequent, meaningful commits to Git\n• Use branching strategy for feature development\n• Write clear commit messages describing changes\n• Document your code and project setup in README\n\n📊 Testing and Deployment:\n• Unit test individual components\n• Integration test the complete system\n• Consider user experience and interface design\n• Deploy to a platform like GitHub Pages, Heroku, or AWS`,
        
        'Essay': `📝 COMPUTER SCIENCE ESSAY WRITING:\n\n🎯 Topic Development:\n• Explore current trends: AI, blockchain, quantum computing, cybersecurity\n• Analyze the societal impact of technology\n• Compare different programming paradigms or technologies\n• Discuss ethical implications of computing innovations\n\n🔬 Research Methodology:\n• Use academic sources: ACM Digital Library, IEEE Xplore\n• Include case studies and real-world examples\n• Reference current industry practices and standards\n• Cite recent research papers and technical documentation\n\n💡 Technical Writing Skills:\n• Balance technical accuracy with readability\n• Use diagrams and code snippets to illustrate concepts\n• Define technical terms for non-expert readers\n• Structure arguments logically with clear evidence`
      },
      
      'Physics': {
        'Exam': `⚡ PHYSICS EXAM DOMINATION:\n\n🎯 Problem-Solving Methodology:\n• Always start by drawing a diagram and identifying given information\n• List relevant physics principles and equations\n• Check if your answer makes physical sense (units, magnitude, direction)\n• Practice solving problems without a calculator first\n\n📐 Mathematical Preparation:\n• Master vector operations and trigonometry\n• Be comfortable with calculus for advanced physics\n• Understand when to use approximations\n• Practice dimensional analysis to catch errors\n\n🧪 Conceptual Understanding:\n• Don't just memorize formulas - understand the underlying principles\n• Be able to explain physics concepts in plain English\n• Know when different laws and theories apply\n• Understand the assumptions and limitations of physics models\n\n⚠️ Common Exam Pitfalls:\n• Not reading the problem carefully (missing key information)\n• Using wrong coordinate systems or reference frames\n• Forgetting to convert units consistently\n• Making sign errors with vectors and directions`,
        
        'Homework': `🔬 PHYSICS HOMEWORK EXCELLENCE:\n\n📊 Problem-Solving Process:\n• Read the problem multiple times to fully understand what's being asked\n• Identify the physics concepts involved\n• Draw clear, labeled diagrams with coordinate systems\n• List known quantities and what you need to find\n• Choose appropriate equations and solve algebraically before substituting numbers\n\n💡 Conceptual Development:\n• Don't just plug numbers into formulas - understand the physics\n• Ask yourself "What would happen if...?" questions\n• Connect problems to real-world situations\n• Review the physics principles after solving each problem\n\n🛠️ Useful Tools and Resources:\n• PhET simulations for interactive physics visualization\n• Wolfram Alpha for checking calculations\n• Khan Academy Physics for concept review\n• YouTube channels like Physics Girl and MinutePhysics\n\n✅ Quality Check Process:\n• Verify units cancel correctly in your calculations\n• Check if your answer is reasonable in magnitude\n• Consider limiting cases (what happens if a variable approaches zero or infinity?)\n• Review your work for algebraic and arithmetic errors`,
        
        'Project': `🚀 PHYSICS PROJECT MASTERY:\n\n🔬 Experimental Design:\n• Formulate a clear, testable hypothesis\n• Identify and control variables in your experiment\n• Plan data collection methods and measurement techniques\n• Consider sources of error and uncertainty\n\n📊 Data Analysis Excellence:\n• Use appropriate statistical methods and error analysis\n• Create clear graphs with proper labels and units\n• Fit models to your data and interpret parameters\n• Discuss agreement between theory and experiment\n\n💻 Simulation and Modeling:\n• Use software like Python, MATLAB, or Mathematica\n• Start with simple models and add complexity gradually\n• Validate your simulations against known results\n• Explore parameter space to understand system behavior\n\n📋 Scientific Communication:\n• Write in clear, objective scientific style\n• Include proper citations of scientific literature\n• Present results with appropriate significant figures\n• Discuss implications and future research directions`,
        
        'Essay': `📚 PHYSICS ESSAY WRITING:\n\n🎯 Content Strategy:\n• Explore the historical development of physics concepts\n• Discuss applications of physics in technology and engineering\n• Analyze current research frontiers in physics\n• Connect physics principles to everyday phenomena\n\n🔬 Research Excellence:\n• Use peer-reviewed scientific journals and textbooks\n• Include perspectives from multiple physicists and researchers\n• Verify scientific facts and historical information\n• Stay current with recent discoveries and developments\n\n💡 Writing Techniques:\n• Explain complex concepts using analogies and examples\n• Use mathematical expressions when appropriate\n• Include diagrams and figures to support your explanations\n• Balance technical detail with accessibility`
      },
      
      'Chemistry': {
        'Exam': `🧪 CHEMISTRY EXAM STRATEGY:\n\n🎯 Focus Areas:\n• Master chemical equations and balancing techniques\n• Understand molecular structures and bonding\n• Practice stoichiometry and concentration calculations\n• Review periodic table trends and properties\n\n💡 Problem-Solving Approach:\n• Always balance chemical equations first\n• Use dimensional analysis for conversions\n• Draw Lewis structures for molecular problems\n• Show all work with proper units\n• Check that your answers make chemical sense\n\n⚠️ Common Pitfalls to Avoid:\n• Forgetting to balance equations\n• Mixing up units in calculations\n• Not considering chemical principles\n• Rushing through stoichiometry problems`,
        'Lab Report': `🧪 CHEMISTRY LAB REPORT EXCELLENCE:\n\n📋 Pre-Lab Preparation:\n• Review safety protocols and chemical hazards\n• Understand the experimental procedure thoroughly\n• Prepare data tables and observation sheets\n• Gather all required equipment and chemicals\n\n🔬 Experimental Execution:\n• Follow safety procedures strictly\n• Record all observations immediately\n• Take precise measurements with proper units\n• Note any unexpected reactions or observations\n• Document experimental conditions (temperature, pressure, etc.)\n\n📊 Data Analysis:\n• Perform all calculations with proper units\n• Create clear graphs with labeled axes\n• Include error analysis and uncertainty\n• Compare results with theoretical values\n• Identify sources of experimental error\n\n📝 Report Writing:\n• Follow standard lab report format\n• Include all required sections (Abstract, Introduction, Methods, Results, Discussion, Conclusion)\n• Use clear, scientific language\n• Include proper citations and references\n• Discuss sources of error and improvements`,
        'Project': `🧪 CHEMISTRY PROJECT DEVELOPMENT:\n\n🔬 Experimental Design:\n• Formulate a clear, testable hypothesis\n• Design controlled experiments with proper variables\n• Consider safety requirements and chemical hazards\n• Plan data collection methods and analysis\n\n📊 Research and Analysis:\n• Conduct thorough literature review\n• Use appropriate analytical techniques\n• Perform statistical analysis of results\n• Compare findings with existing research\n\n💻 Computational Chemistry:\n• Use software like Gaussian, Spartan, or Avogadro\n• Model molecular structures and reactions\n• Perform energy calculations and optimizations\n• Validate computational results with experimental data\n\n📋 Scientific Communication:\n• Write in clear, objective scientific style\n• Include proper chemical nomenclature\n• Present data with appropriate significant figures\n• Discuss implications and future research directions`,
        'Essay': `📚 CHEMISTRY ESSAY WRITING:\n\n🎯 Content Strategy:\n• Explore chemical principles and their applications\n• Discuss environmental chemistry and sustainability\n• Analyze current research in chemical sciences\n• Connect chemistry to everyday life and technology\n\n🔬 Research Excellence:\n• Use peer-reviewed chemical journals and databases\n• Include perspectives from multiple researchers\n• Verify chemical facts and safety information\n• Stay current with recent discoveries and developments\n\n💡 Writing Techniques:\n• Use proper chemical nomenclature\n• Include balanced chemical equations when relevant\n• Explain complex concepts using analogies\n• Balance technical detail with accessibility`
      }
    };

    const defaultAdvice = {
      'Exam': `📚 COMPREHENSIVE EXAM PREPARATION:\n\n🎯 Study Strategy:\n• Create a detailed study schedule 2-3 weeks before the exam\n• Review course materials systematically, focusing on key concepts\n• Practice with past exams and sample questions\n• Form study groups to discuss difficult concepts\n\n💡 Active Learning Techniques:\n• Teach concepts to others or explain them out loud\n• Create concept maps connecting related ideas\n• Use flashcards for key terms and formulas\n• Take practice tests under timed conditions\n\n⚠️ Pre-Exam Preparation:\n• Get adequate sleep the night before\n• Eat a healthy breakfast on exam day\n• Arrive early to reduce stress\n• Bring all necessary materials and backups`,
      
      'Homework': `📋 HOMEWORK OPTIMIZATION:\n\n🎯 Planning and Organization:\n• Read all instructions carefully before starting\n• Break large assignments into smaller, manageable tasks\n• Set specific deadlines for each component\n• Gather all necessary resources and materials\n\n💡 Execution Excellence:\n• Start with the most challenging parts when your mind is fresh\n• Take regular breaks to maintain focus\n• Double-check your work before submission\n• Keep backups of all digital work\n\n🔄 Learning Integration:\n• Connect homework to course concepts and lectures\n• Ask questions when you encounter difficulties\n• Review feedback on returned assignments\n• Use homework as practice for exams`,
      
      'Project': `🏗️ PROJECT MANAGEMENT MASTERY:\n\n📋 Planning Phase:\n• Define project scope, objectives, and deliverables clearly\n• Research thoroughly and gather all necessary resources\n• Create a detailed timeline with milestones and deadlines\n• Identify potential challenges and develop contingency plans\n\n💻 Execution Strategy:\n• Follow a structured approach to development\n• Document your process and decisions along the way\n• Seek feedback from peers or instructors during development\n• Test and refine your work iteratively\n\n📊 Quality Assurance:\n• Review all components against initial requirements\n• Proofread and edit all written materials\n• Ensure all sources are properly cited\n• Prepare for presentation or defense if required`,
      
      'Essay': `✍️ ESSAY WRITING EXCELLENCE:\n\n📚 Research and Planning:\n• Understand the assignment requirements and grading criteria\n• Develop a clear thesis statement and argument structure\n• Gather credible sources from academic databases\n• Create a detailed outline before writing\n\n💡 Writing Process:\n• Write multiple drafts, focusing on content first\n• Use clear topic sentences and logical transitions\n• Support all claims with evidence and examples\n• Maintain consistent style and voice throughout\n\n✅ Revision and Editing:\n• Review for logical flow and argument strength\n• Check grammar, spelling, and citation format\n• Read your essay aloud to catch awkward phrasing\n• Get feedback from others before final submission`,
      
      'Presentation': `🎤 PRESENTATION MASTERY:\n\n📋 Content Development:\n• Know your audience and tailor content accordingly\n• Structure presentation with clear introduction, body, and conclusion\n• Use visual aids to enhance understanding, not distract\n• Prepare for potential questions and challenges\n\n🎯 Delivery Excellence:\n• Practice your presentation multiple times\n• Work on clear speaking and appropriate pacing\n• Use confident body language and eye contact\n• Have backup plans for technical difficulties\n\n💡 Engagement Strategies:\n• Start with a compelling hook or question\n• Use stories and examples to illustrate points\n• Interact with audience through questions or activities\n• End with a memorable conclusion and call to action`,
      
      'Quiz': `⚡ QUIZ PREPARATION STRATEGY:\n\n🎯 Focused Review:\n• Identify key concepts likely to be covered\n• Review recent lectures, readings, and assignments\n• Practice with sample questions if available\n• Create summary notes for quick review\n\n💡 Test-Taking Skills:\n• Read all questions carefully before answering\n• Manage your time effectively\n• Answer easy questions first to build confidence\n• Review answers if time permits\n\n🔄 Learning Integration:\n• Use quizzes as checkpoints for understanding\n• Review incorrect answers to identify knowledge gaps\n• Connect quiz content to broader course themes\n• Prepare more thoroughly for upcoming exams`,
      
      'Other': `🎯 GENERAL ACADEMIC EXCELLENCE:\n\n📋 Task Analysis:\n• Break complex assignments into smaller, manageable components\n• Identify required skills and knowledge for completion\n• Set realistic goals and deadlines for each component\n• Gather all necessary resources and tools\n\n💡 Execution Strategy:\n• Start early to allow time for revisions and improvements\n• Maintain organization and document your progress\n• Seek help when needed from instructors, peers, or tutoring services\n• Focus on quality and thoroughness over speed\n\n✅ Quality Assurance:\n• Review work against assignment requirements\n• Check for completeness and accuracy\n• Ensure proper formatting and presentation\n• Submit on time and keep backups of all work`
    };

    const advice = subjectAdvice[subject]?.[assignmentType as keyof typeof subjectAdvice[typeof subject]] || defaultAdvice[assignmentType as keyof typeof defaultAdvice] || defaultAdvice['Other'];
    return advice;
  };

  const generateStudySteps = (assignmentType: string, urgencyLevel: string, daysUntilDue: number | null): TaskPlanningStep[] => {
    const baseSteps: { [key: string]: TaskPlanningStep[] } = {
      'Exam': [
        {
          id: 'review-materials',
          title: 'Review Course Materials',
          description: 'Go through lecture notes, textbooks, and past assignments',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Course notes', 'Textbook', 'Past assignments'],
          tips: ['Create summary sheets', 'Identify key concepts', 'Review practice problems']
        },
        {
          id: 'practice-problems',
          title: 'Practice Problems',
          description: 'Work through sample problems and past exam questions',
          estimated_time: 4,
          priority: 'high' as const,
          resources: ['Practice exams', 'Sample problems', 'Study guides'],
          tips: ['Time yourself', 'Review mistakes', 'Focus on weak areas']
        },
        {
          id: 'final-review',
          title: 'Final Review',
          description: 'Quick review of key concepts and formulas',
          estimated_time: 2,
          priority: 'medium' as const,
          resources: ['Summary sheets', 'Key formulas', 'Important concepts'],
          tips: ['Get good sleep', 'Eat well', 'Arrive early']
        }
      ],
      'Essay': [
        {
          id: 'research',
          title: 'Research and Planning',
          description: 'Gather sources and develop thesis statement',
          estimated_time: 4,
          priority: 'high' as const,
          resources: ['Academic databases', 'Library resources', 'Citation tools'],
          tips: ['Take detailed notes', 'Evaluate source credibility', 'Start bibliography early']
        },
        {
          id: 'outline',
          title: 'Create Outline',
          description: 'Organize ideas and create detailed structure',
          estimated_time: 2,
          priority: 'high' as const,
          resources: ['Outline templates', 'Writing guidelines'],
          tips: ['Start with main points', 'Include evidence for each point', 'Check logical flow']
        },
        {
          id: 'draft',
          title: 'Write First Draft',
          description: 'Write complete first version of essay',
          estimated_time: 6,
          priority: 'high' as const,
          resources: ['Outline', 'Research notes', 'Writing guidelines'],
          tips: ['Don\'t worry about perfection', 'Focus on content first', 'Use clear topic sentences']
        },
        {
          id: 'revise',
          title: 'Revise and Edit',
          description: 'Improve content, structure, and clarity',
          estimated_time: 3,
          priority: 'medium' as const,
          resources: ['Writing center', 'Peer review', 'Grammar checkers'],
          tips: ['Read aloud', 'Check for logical flow', 'Verify citations']
        }
      ],
      'Project': [
        {
          id: 'planning',
          title: 'Project Planning',
          description: 'Define scope, requirements, and timeline',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Project templates', 'Requirements documents'],
          tips: ['Break into phases', 'Set milestones', 'Identify risks early']
        },
        {
          id: 'research',
          title: 'Research and Design',
          description: 'Gather information and design solution',
          estimated_time: 5,
          priority: 'high' as const,
          resources: ['Research databases', 'Design tools', 'Industry standards'],
          tips: ['Document your process', 'Consider alternatives', 'Get feedback early']
        },
        {
          id: 'implementation',
          title: 'Implementation',
          description: 'Build and develop the project',
          estimated_time: 8,
          priority: 'high' as const,
          resources: ['Development tools', 'Testing frameworks', 'Documentation'],
          tips: ['Test frequently', 'Version control', 'Document as you go']
        },
        {
          id: 'testing',
          title: 'Testing and Refinement',
          description: 'Test thoroughly and make improvements',
          estimated_time: 4,
          priority: 'medium' as const,
          resources: ['Testing tools', 'User feedback', 'Quality metrics'],
          tips: ['Test edge cases', 'Get user feedback', 'Document issues']
        }
      ],
      'Lab Report': [
        {
          id: 'experiment-planning',
          title: 'Experiment Planning & Safety Review',
          description: 'Review lab procedures, safety protocols, and prepare materials list',
          estimated_time: 2,
          priority: 'high' as const,
          resources: ['Lab manual', 'Safety guidelines', 'Equipment checklist'],
          tips: ['Review safety protocols thoroughly', 'Prepare all materials in advance', 'Understand the experimental procedure']
        },
        {
          id: 'data-collection',
          title: 'Data Collection & Experimentation',
          description: 'Conduct the experiment, record observations, and collect data',
          estimated_time: 4,
          priority: 'high' as const,
          resources: ['Lab equipment', 'Data sheets', 'Measurement tools'],
          tips: ['Record everything immediately', 'Take photos of setup and results', 'Note any unexpected observations']
        },
        {
          id: 'data-analysis',
          title: 'Data Analysis & Calculations',
          description: 'Process data, perform calculations, and create graphs/charts',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Excel/Google Sheets', 'Graphing software', 'Statistical tools'],
          tips: ['Double-check all calculations', 'Include error analysis', 'Create clear, labeled graphs']
        },
        {
          id: 'report-writing',
          title: 'Report Writing',
          description: 'Write the complete lab report with proper scientific format',
          estimated_time: 5,
          priority: 'high' as const,
          resources: ['Lab report template', 'Scientific writing guides', 'Citation tools'],
          tips: ['Follow the standard lab report format', 'Include all required sections', 'Use clear, scientific language']
        },
        {
          id: 'review-revision',
          title: 'Review & Revision',
          description: 'Proofread, check calculations, and ensure all requirements are met',
          estimated_time: 2,
          priority: 'medium' as const,
          resources: ['Lab report checklist', 'Peer review', 'Instructor guidelines'],
          tips: ['Verify all calculations', 'Check formatting requirements', 'Ensure all sections are complete']
        }
      ],
      'Homework': [
        {
          id: 'problem-analysis',
          title: 'Problem Analysis',
          description: 'Read through problems carefully and identify what is being asked',
          estimated_time: 1,
          priority: 'high' as const,
          resources: ['Textbook', 'Class notes', 'Problem-solving guides'],
          tips: ['Underline key information', 'Identify given and unknown variables', 'Understand the problem type']
        },
        {
          id: 'solution-development',
          title: 'Solution Development',
          description: 'Work through problems step-by-step with clear methodology',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Practice problems', 'Solution examples', 'Study guides'],
          tips: ['Show all work clearly', 'Check units and calculations', 'Use appropriate formulas']
        },
        {
          id: 'verification',
          title: 'Solution Verification',
          description: 'Check answers, verify calculations, and ensure completeness',
          estimated_time: 1,
          priority: 'medium' as const,
          resources: ['Answer keys', 'Verification methods', 'Peer review'],
          tips: ['Double-check all calculations', 'Verify units are correct', 'Ensure all problems are attempted']
        }
      ],
      'Presentation': [
        {
          id: 'content-research',
          title: 'Content Research & Organization',
          description: 'Research topic thoroughly and organize key points',
          estimated_time: 4,
          priority: 'high' as const,
          resources: ['Research databases', 'Topic guides', 'Organizational tools'],
          tips: ['Focus on main points only', 'Create clear structure', 'Gather supporting evidence']
        },
        {
          id: 'visual-design',
          title: 'Visual Design & Slides',
          description: 'Create engaging slides with clear visuals and minimal text',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Presentation software', 'Design templates', 'Image resources'],
          tips: ['Use bullet points, not paragraphs', 'Include relevant images', 'Keep slides simple and clear']
        },
        {
          id: 'rehearsal',
          title: 'Rehearsal & Timing',
          description: 'Practice delivery multiple times and time your presentation',
          estimated_time: 2,
          priority: 'medium' as const,
          resources: ['Timer', 'Recording device', 'Practice audience'],
          tips: ['Practice with timing', 'Record yourself speaking', 'Prepare for questions']
        }
      ],
      'Quiz': [
        {
          id: 'topic-review',
          title: 'Topic Review',
          description: 'Review key concepts, formulas, and important details',
          estimated_time: 2,
          priority: 'high' as const,
          resources: ['Class notes', 'Textbook', 'Study guides'],
          tips: ['Focus on main concepts', 'Create quick reference sheets', 'Review recent material']
        },
        {
          id: 'practice-questions',
          title: 'Practice Questions',
          description: 'Work through sample questions and past quiz problems',
          estimated_time: 3,
          priority: 'high' as const,
          resources: ['Practice quizzes', 'Sample problems', 'Flashcards'],
          tips: ['Time yourself on practice questions', 'Review incorrect answers', 'Focus on weak areas']
        },
        {
          id: 'final-prep',
          title: 'Final Preparation',
          description: 'Quick review of key points and mental preparation',
          estimated_time: 1,
          priority: 'medium' as const,
          resources: ['Summary notes', 'Key formulas', 'Mental preparation'],
          tips: ['Get adequate sleep', 'Eat a good meal', 'Arrive early and relaxed']
        }
      ]
    };

    // Adjust steps based on urgency
    let steps = baseSteps[assignmentType] || baseSteps['Project']; // Default to Project instead of Essay
    
    if (urgencyLevel === 'CRITICAL' && daysUntilDue !== null && daysUntilDue <= 1) {
      // Emergency mode - condensed steps
      steps = steps.map(step => ({
        ...step,
        estimated_time: Math.max(1, step.estimated_time * 0.5),
        tips: [...step.tips, '⚠️ CRITICAL: Focus on essential requirements only', 'Consider requesting extension if possible']
      }));
    } else if (urgencyLevel === 'HIGH' && daysUntilDue !== null && daysUntilDue <= 3) {
      // High urgency - slightly condensed
      steps = steps.map(step => ({
        ...step,
        estimated_time: Math.max(1, step.estimated_time * 0.7),
        tips: [...step.tips, '⏰ High priority - start immediately', 'Set daily milestones']
      }));
    }

    return steps;
  };

  const generateStudySchedule = (steps: TaskPlanningStep[], daysUntilDue: number | null, urgencyLevel: string) => {
    const totalHours = steps.reduce((sum, step) => sum + step.estimated_time, 0);
    
    if (urgencyLevel === 'CRITICAL' && daysUntilDue !== null && daysUntilDue <= 1) {
      return {
        daily_goals: [
          'Complete all essential steps today',
          'Focus on core requirements only',
          'Prepare for immediate submission'
        ],
        weekly_milestones: [
          'Complete entire project in one day',
          'Submit before deadline'
        ],
        time_management: 'Emergency mode: Allocate all available time today. Consider requesting extension.'
      };
    } else if (urgencyLevel === 'HIGH' && daysUntilDue !== null && daysUntilDue <= 3) {
      const hoursPerDay = Math.ceil(totalHours / daysUntilDue);
      return {
        daily_goals: [
          `Complete ${hoursPerDay} hours of work daily`,
          'Focus on highest priority steps first',
          'Set specific daily milestones'
        ],
        weekly_milestones: [
          'Complete research and planning phase',
          'Finish main implementation',
          'Submit on time'
        ],
        time_management: `Allocate ${hoursPerDay} hours daily. Start immediately and work consistently.`
      };
    } else {
      const hoursPerDay = Math.max(2, Math.ceil(totalHours / 7));
      return {
        daily_goals: [
          `Study ${hoursPerDay} hours daily`,
          'Work on one major step per day',
          'Review and revise regularly'
        ],
        weekly_milestones: [
          'Complete research phase',
          'Finish first draft',
          'Complete revisions',
          'Submit final version'
        ],
        time_management: `Spread work over ${Math.ceil(totalHours / hoursPerDay)} days with ${hoursPerDay} hours daily.`
      };
    }
  };

  const generateResources = (subject: string, assignmentType: string) => {
    const subjectResources: { [key: string]: any[] } = {
      'Mathematics': [
        { title: 'Khan Academy - Mathematics', description: 'Free comprehensive math courses from basic arithmetic to advanced calculus', url: 'https://www.khanacademy.org/math' },
        { title: 'Professor Leonard - Calculus', description: 'Clear step-by-step calculus explanations and problem solving', url: 'https://www.youtube.com/channel/UCoHhuummRZaIVX7bD4t2czg' },
        { title: 'MIT OpenCourseWare - Math', description: 'Free MIT mathematics courses including linear algebra and differential equations', url: 'https://ocw.mit.edu/courses/mathematics/' },
        { title: 'Wolfram Alpha', description: 'Computational engine for math problem solving and step-by-step solutions', url: 'https://www.wolframalpha.com' }
      ],
      'Computer Science': [
        { title: 'CS50x - Harvard', description: 'Harvard\'s introduction to computer science covering algorithms and data structures', url: 'https://cs50.harvard.edu/x/' },
        { title: 'freeCodeCamp', description: 'Interactive coding lessons and projects in web development and programming', url: 'https://www.freecodecamp.org' },
        { title: 'MIT 6.006 - Algorithms', description: 'Introduction to algorithms course with video lectures and problem sets', url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/' },
        { title: 'Coding Train - YouTube', description: 'Creative coding tutorials and programming challenges', url: 'https://www.youtube.com/c/TheCodingTrain' }
      ],
      'Physics': [
        { title: 'Khan Academy - Physics', description: 'Physics courses covering mechanics, electricity, magnetism, and modern physics', url: 'https://www.khanacademy.org/science/physics' },
        { title: 'MIT 8.01 - Classical Mechanics', description: 'MIT\'s physics course with video lectures and problem sets', url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/' },
        { title: 'Physics Girl - YouTube', description: 'Engaging physics explanations and experiments', url: 'https://www.youtube.com/c/PhysicsGirl' },
        { title: 'PhET Interactive Simulations', description: 'Interactive physics simulations for hands-on learning', url: 'https://phet.colorado.edu/en/simulations/physics' }
      ],
      'Chemistry': [
        { title: 'Khan Academy - Chemistry', description: 'Complete chemistry courses from general to organic chemistry', url: 'https://www.khanacademy.org/science/chemistry' },
        { title: 'Crash Course Chemistry', description: 'Fast-paced chemistry lessons covering major topics with visual explanations', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtPHzzYuWy6fYEaX9mQQ8oGr' },
        { title: 'ChemLibreTexts', description: 'Open-access chemistry textbooks and resources', url: 'https://chem.libretexts.org/' },
        { title: 'MIT 5.111 - Chemistry', description: 'MIT general chemistry course with lectures and materials', url: 'https://ocw.mit.edu/courses/5-111sc-principles-of-chemical-science-fall-2014/' }
      ],
      'Biology': [
        { title: 'Khan Academy - Biology', description: 'Biology courses covering molecular biology, genetics, and ecology', url: 'https://www.khanacademy.org/science/biology' },
        { title: 'Crash Course Biology', description: 'Comprehensive biology topics explained with animations', url: 'https://www.youtube.com/playlist?list=PL3EED4C1D684D3ADF' },
        { title: 'MIT 7.012 - Biology', description: 'MIT introduction to biology with molecular focus', url: 'https://ocw.mit.edu/courses/7-012-introduction-to-biology-fall-2004/' },
        { title: 'iBiology', description: 'Talks by leading scientists on cutting-edge biology research', url: 'https://www.ibiology.org/' }
      ],
      'Literature': [
        { title: 'Yale Open Courses - Literature', description: 'Yale literature courses including Shakespeare and modern poetry', url: 'https://oyc.yale.edu/english' },
        { title: 'Crash Course Literature', description: 'Analysis of major literary works and writing techniques', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtOeEc9ME62zTfqc0h6Pe8vb' },
        { title: 'Poetry Foundation', description: 'Extensive collection of poems with analysis and educational resources', url: 'https://www.poetryfoundation.org/' },
        { title: 'Purdue OWL', description: 'Writing and citation guidelines for academic papers', url: 'https://owl.purdue.edu/owl/research_and_citation/' }
      ],
      'History': [
        { title: 'Khan Academy - World History', description: 'Comprehensive world history from ancient civilizations to modern times', url: 'https://www.khanacademy.org/humanities/world-history' },
        { title: 'Crash Course World History', description: 'Fast-paced world history lessons with engaging visuals', url: 'https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9' },
        { title: 'Yale Open Courses - History', description: 'Yale history courses covering various periods and regions', url: 'https://oyc.yale.edu/history' },
        { title: 'Primary Source Documents', description: 'Historical documents and sources for research', url: 'https://www.loc.gov/teachers/' }
      ],
      'English': [
        { title: 'Khan Academy - Grammar', description: 'English grammar, writing skills, and essay composition', url: 'https://www.khanacademy.org/humanities/grammar' },
        { title: 'Purdue OWL Writing Lab', description: 'Comprehensive writing resources and citation guides', url: 'https://owl.purdue.edu/owl/purdue_owl.html' },
        { title: 'Grammarly Handbook', description: 'Grammar rules, writing tips, and style guidelines', url: 'https://www.grammarly.com/blog/handbook/' },
        { title: 'TED-Ed Writing', description: 'Short videos on writing techniques and literary analysis', url: 'https://ed.ted.com/lessons?category=literature-language-arts' }
      ]
    };

    const generalResources = [
      { title: 'Coursera', description: 'University-level courses from top institutions worldwide', url: 'https://www.coursera.org' },
      { title: 'edX', description: 'Free online courses from Harvard, MIT, and other universities', url: 'https://www.edx.org' },
      { title: 'Study.com', description: 'Video lessons and practice tests for various subjects', url: 'https://study.com' },
      { title: 'Quizlet', description: 'Flashcards and study tools for memorization and review', url: 'https://quizlet.com' }
    ];

    return [...(subjectResources[subject] || []), ...generalResources];
  };

  const generateTips = (urgencyLevel: string, assignmentType: string, daysUntilDue: number | null): string[] => {
    const baseTips = [
      'Break work into 25-minute focused sessions',
      'Take regular breaks to maintain focus',
      'Eliminate distractions during study time',
      'Use active learning techniques'
    ];

    const urgencyTips = urgencyLevel === 'CRITICAL' ? [
      '⚠️ CRITICAL: Due in less than 24 hours!',
      'Focus on essential requirements only',
      'Use existing resources and templates',
      'Consider requesting extension if possible'
    ] : urgencyLevel === 'HIGH' ? [
      `⏰ Due in ${daysUntilDue} days - prioritize this task`,
      'Start immediately to avoid last-minute stress',
      'Set daily milestones to track progress',
      'Allow buffer time for unexpected issues'
    ] : [
      '📅 Good time management - stay on schedule',
      'Start early to allow for thorough work',
      'Break work into daily manageable chunks',
      'Schedule regular review sessions'
    ];

    const assignmentTips = {
      'Exam': [
        'Practice with past exams if available',
        'Create study guides and flashcards',
        'Review key concepts and formulas',
        'Get adequate sleep before the exam'
      ],
      'Essay': [
        'Develop a clear thesis statement',
        'Use credible academic sources',
        'Follow proper citation format',
        'Proofread carefully before submitting'
      ],
      'Project': [
        'Plan your approach before starting',
        'Set intermediate deadlines',
        'Document your process thoroughly',
        'Test your work regularly'
      ],
      'Lab Report': [
        'Review safety protocols thoroughly',
        'Record all observations immediately',
        'Include error analysis in calculations',
        'Follow standard lab report format',
        'Double-check all measurements and units'
      ],
      'Homework': [
        'Read problems carefully before starting',
        'Show all work step-by-step',
        'Check your answers for reasonableness',
        'Review class notes for relevant concepts'
      ],
      'Presentation': [
        'Practice your delivery multiple times',
        'Prepare visual aids that enhance understanding',
        'Know your audience and adapt accordingly',
        'Have a backup plan for technical issues'
      ],
      'Quiz': [
        'Review recent material thoroughly',
        'Practice with sample questions',
        'Focus on key concepts and formulas',
        'Get adequate rest before the quiz'
      ]
    };

    return [...baseTips, ...urgencyTips, ...(assignmentTips[assignmentType as keyof typeof assignmentTips] || [])];
  };

  const handleGeneratePlan = async () => {
    await generateComprehensivePlan();
  };

  const handleApplyPlan = () => {
    if (plan) {
      onApplyPlan(plan);
    }
  };

  if (!plan) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-600" />
              AI Task Planning Wizard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                How This Works
              </h3>
              <p className="text-blue-700 text-sm">
                This AI-powered planning wizard will analyze your task and create a comprehensive study plan 
                tailored to your specific situation. It considers your subject, assignment type, due date, 
                and urgency level to provide personalized guidance.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Task Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span> {taskData.title}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {taskData.subject}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {taskData.assignment_type}
                </div>
                <div>
                  <span className="font-medium">Due Date:</span> {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                What You'll Get
              </h3>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Step-by-step action plan with realistic timeframes</li>
                <li>• Subject-specific study strategies and resources</li>
                <li>• Personalized study schedule based on your due date</li>
                <li>• Learning resources and tools for your subject</li>
                <li>• Study tips and techniques for your assignment type</li>
                <li>• Urgency-based prioritization and time management</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating Plan...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Generate Comprehensive Plan
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Wand2 className="h-8 w-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">AI Task Wizard</h2>
                <p className="text-gray-600">Break down your task into detailed subtasks with a personalized study schedule</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-8 p-6">
          {/* Urgency Alert */}
                          {plan.urgency_level === 'CRITICAL' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">CRITICAL URGENCY</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                This task is due very soon! Focus on essential requirements and consider requesting an extension if possible.
              </p>
            </div>
          )}

          {/* Subject-Specific Advice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Subject-Specific Strategy
            </h3>
                              <p className="text-blue-700">{plan.subject_specific_advice}</p>
          </div>

          {/* Study Schedule */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Study Schedule
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-green-700 mb-1">Daily Goals:</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  {plan.study_schedule.daily_goals.map((goal: string, index: number) => (
                    <li key={`daily-goal-${index}`} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-700 mb-1">Weekly Milestones:</h4>
                <ul className="text-sm text-green-600 space-y-1">
                  {plan.study_schedule.weekly_milestones.map((milestone: string, index: number) => (
                    <li key={`weekly-milestone-${index}`} className="flex items-start gap-2">
                      <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {milestone}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-700 mb-1">Time Management:</h4>
                <p className="text-sm text-green-600">{plan.study_schedule.time_management}</p>
              </div>
            </div>
          </div>

          {/* Action Steps */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Action Steps ({plan.total_estimated_time}h total)
            </h3>
            <div className="space-y-3">
              {plan.steps.map((step, index) => (
                <div key={step.id} className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-purple-800">
                      {index + 1}. {step.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      step.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      step.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      step.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {step.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">{step.description}</p>
                  <div className="flex items-center gap-4 text-xs text-purple-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {step.estimated_time}h
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {step.resources.length} resources
                    </span>
                  </div>
                  {step.tips.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-xs font-medium text-purple-700 mb-1">Tips:</h5>
                      <ul className="text-xs text-purple-600 space-y-1">
                        {step.tips.slice(0, 2).map((tip, tipIndex) => (
                          <li key={tipIndex} className="flex items-start gap-1">
                            <Lightbulb className="w-2 h-2 mt-0.5 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Resources */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Learning Resources
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.resources.map((resource, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 text-sm">{resource.title}</h4>
                  <p className="text-xs text-yellow-700 mt-1">{resource.description}</p>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-yellow-600 hover:text-yellow-800 underline mt-1 inline-block"
                    >
                      Visit Resource →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Study Tips */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Study Tips
            </h3>
            <ul className="space-y-2">
              {plan.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-indigo-700">
                  <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleApplyPlan}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Apply This Plan to Task
            </button>
            <button
              onClick={() => setPlan(null)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Generate New Plan
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPlanningWizard; 