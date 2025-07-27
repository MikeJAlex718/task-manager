import os
import logging
from datetime import datetime, date
from typing import Dict, List, Optional
from fastapi import HTTPException
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.claude_api_key = os.getenv("CLAUDE_API_KEY")
        self.claude_api_url = "https://api.anthropic.com/v1/messages"
        
    async def generate_task_breakdown(self, task_data: Dict) -> Dict:
        """
        Generate intelligent task breakdown considering due date and other factors
        """
        try:
            # Extract task information
            title = task_data.get('title', '')
            description = task_data.get('description', '')
            subject = task_data.get('subject', '')
            assignment_type = task_data.get('assignmentType', '')
            due_date_str = task_data.get('dueDate', '')
            estimated_hours = task_data.get('estimatedHours', 0)
            
            # Calculate urgency based on due date
            urgency_level = self._calculate_urgency_level(due_date_str)
            
            # If Claude API is available, use it for intelligent breakdown
            if self.claude_api_key:
                return await self._get_claude_breakdown(
                    title, description, subject, assignment_type, 
                    due_date_str, estimated_hours, urgency_level
                )
            else:
                # Fallback to rule-based breakdown
                return self._get_rule_based_breakdown(
                    title, description, subject, assignment_type,
                    due_date_str, estimated_hours, urgency_level
                )
                
        except Exception as e:
            logger.error(f"Error generating task breakdown: {e}")
            # Return a basic breakdown as fallback
            return self._get_basic_breakdown()
    
    def _calculate_urgency_level(self, due_date_str: str) -> str:
        """Calculate urgency level based on due date"""
        if not due_date_str:
            return "LOW"
            
        try:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            days_until_due = (due_date - date.today()).days
            
            if days_until_due < 0:
                return "OVERDUE"
            elif days_until_due <= 1:
                return "CRITICAL"
            elif days_until_due <= 3:
                return "HIGH"
            elif days_until_due <= 7:
                return "MEDIUM"
            else:
                return "LOW"
        except:
            return "LOW"
    
    async def _get_claude_breakdown(self, title: str, description: str, subject: str,
                                   assignment_type: str, due_date_str: str, 
                                   estimated_hours: float, urgency_level: str) -> Dict:
        """Get intelligent breakdown from Claude API"""
        try:
            # Create prompt for Claude
            prompt = self._create_claude_prompt(
                title, description, subject, assignment_type,
                due_date_str, estimated_hours, urgency_level
            )
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": self.claude_api_key,
                "anthropic-version": "2023-06-01"
            }
            
            data = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = requests.post(self.claude_api_url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                content = result['content'][0]['text']
                
                # Parse Claude's response into structured format
                return self._parse_claude_response(content, urgency_level)
            else:
                logger.warning(f"Claude API error: {response.status_code}")
                return self._get_rule_based_breakdown(
                    title, description, subject, assignment_type,
                    due_date_str, estimated_hours, urgency_level
                )
                
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return self._get_rule_based_breakdown(
                title, description, subject, assignment_type,
                due_date_str, estimated_hours, urgency_level
            )
    
    def _create_claude_prompt(self, title: str, description: str, subject: str,
                             assignment_type: str, due_date_str: str,
                             estimated_hours: float, urgency_level: str) -> str:
        """Create a detailed prompt for Claude"""
        
        prompt = f"""
You are an expert academic advisor and tutor helping a student break down an assignment into actionable steps with specific learning resources.

TASK INFORMATION:
- Title: {title}
- Description: {description}
- Subject: {subject}
- Assignment Type: {assignment_type}
- Due Date: {due_date_str}
- Urgency Level: {urgency_level}

Please provide a comprehensive breakdown in the following JSON format:
{{
  "subtasks": [
    {{
      "title": "Specific step name",
      "description": "Detailed explanation of what to do",
      "estimatedHours": hours,
      "priority": "high/medium/low",
      "learningResources": ["List of specific learning resources for this step"]
    }}
  ],
  "resources": [
    {{
      "type": "video/website/book",
      "title": "Resource name",
      "url": "URL if applicable",
      "description": "Why this resource helps"
    }}
  ],
  "tips": [
    "Specific study and productivity tips for this assignment type"
  ],
  "schedule": {{
    "dailyGoals": ["List of daily goals"],
    "weeklyMilestones": ["List of weekly milestones"],
    "timeManagement": "Specific time management advice"
  }},
  "subjectSpecificAdvice": "Subject-specific study strategies and tips"
}}

IMPORTANT GUIDELINES:
1. Make subtasks VERY specific and actionable (e.g., "Research 3 peer-reviewed sources on topic X" not just "Research")
2. Include specific learning resources like Khan Academy videos, YouTube channels, educational websites
3. Provide realistic time estimates based on assignment type and complexity
4. Give subject-specific study strategies (e.g., math problems vs essay writing)
5. Include specific daily and weekly goals for time management
6. Consider the urgency level when creating the schedule

For {assignment_type} assignments in {subject}, focus on:
- Specific learning resources for {subject}
- {assignment_type}-specific strategies
- Realistic time management for students
- Subject-specific study techniques

Provide practical, actionable advice that a student can follow immediately.
"""
        return prompt
    
    def _parse_claude_response(self, content: str, urgency_level: str) -> Dict:
        """Parse Claude's response into structured format"""
        try:
            # Try to extract JSON from Claude's response
            import json
            import re
            
            # Find JSON in the response
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                return {
                    "subtasks": parsed.get("subtasks", []),
                    "resources": parsed.get("resources", []),
                    "tips": parsed.get("tips", []),
                    "urgencyLevel": urgency_level,
                    "urgencyAdvice": parsed.get("urgencyAdvice", "")
                }
        except:
            pass
        
        # Fallback if parsing fails
        return self._get_rule_based_breakdown("", "", "", "", "", 0, urgency_level)
    
    def _get_rule_based_breakdown(self, title: str, description: str, subject: str,
                                 assignment_type: str, due_date_str: str,
                                 estimated_hours: float, urgency_level: str) -> Dict:
        """Generate breakdown using rule-based logic"""
        
        # Subject-specific resources
        subject_resources = self._get_subject_resources(subject)
        
        # Assignment type specific strategies
        assignment_strategies = self._get_assignment_strategies(assignment_type)
        
        if urgency_level == "CRITICAL":
            subtasks = [
                {"title": "Quick Research & Planning", "description": "Gather essential information and create a minimal outline", "estimatedHours": 1, "priority": "high", "learningResources": ["Khan Academy crash course", "YouTube summary videos"]},
                {"title": "Core Content Creation", "description": "Focus on essential requirements only - quality over quantity", "estimatedHours": 2, "priority": "high", "learningResources": ["Subject-specific templates", "Quick reference guides"]},
                {"title": "Essential Review & Polish", "description": "Quick proofread and format for submission", "estimatedHours": 0.5, "priority": "high", "learningResources": ["Grammar check tools", "Formatting guides"]}
            ]
            tips = [
                "⚠️ CRITICAL: Due in less than 24 hours!",
                "Focus on essential requirements only",
                "Use existing templates and resources",
                "Consider requesting extension if possible",
                "Prioritize quality over quantity"
            ]
        elif urgency_level == "HIGH":
            subtasks = [
                {"title": "Research & Information Gathering", "description": "Collect key sources and materials needed", "estimatedHours": 2, "priority": "high", "learningResources": subject_resources},
                {"title": "Detailed Planning & Outline", "description": "Create comprehensive structure and timeline", "estimatedHours": 1, "priority": "high", "learningResources": ["Outline templates", "Planning tools"]},
                {"title": "Content Development", "description": "Complete the main work with focus on quality", "estimatedHours": 4, "priority": "high", "learningResources": assignment_strategies},
                {"title": "Review & Refinement", "description": "Proofread, edit, and finalize", "estimatedHours": 1, "priority": "high", "learningResources": ["Editing checklists", "Peer review guidelines"]}
            ]
            tips = [
                "⏰ Due soon - prioritize this task",
                "Start immediately to avoid last-minute stress",
                "Set daily milestones to track progress",
                "Allow buffer time for unexpected issues",
                "Use focused study sessions"
            ]
        else:
            subtasks = [
                {"title": "Comprehensive Research", "description": "Thorough information gathering and source evaluation", "estimatedHours": 3, "priority": "medium", "learningResources": subject_resources},
                {"title": "Detailed Planning & Structure", "description": "Create comprehensive outline and timeline", "estimatedHours": 2, "priority": "medium", "learningResources": ["Advanced planning tools", "Project management guides"]},
                {"title": "Content Development", "description": "Complete main work with attention to detail", "estimatedHours": 6, "priority": "medium", "learningResources": assignment_strategies},
                {"title": "Revision & Enhancement", "description": "Improve and refine content quality", "estimatedHours": 3, "priority": "medium", "learningResources": ["Advanced editing techniques", "Quality improvement guides"]},
                {"title": "Final Review & Polish", "description": "Comprehensive proofread and final touches", "estimatedHours": 2, "priority": "medium", "learningResources": ["Final review checklists", "Submission guidelines"]}
            ]
            tips = [
                "📅 Good time management!",
                "Start early to allow for thorough research",
                "Break work into daily manageable chunks",
                "Schedule regular review sessions",
                "Use spaced repetition for better retention"
            ]
        
        # Enhanced resources with specific links
        resources = [
            {
                "type": "video",
                "title": f"Khan Academy - {subject}",
                "url": f"https://www.khanacademy.org/search?page_search_query={subject}",
                "description": f"Comprehensive {subject} tutorials and practice exercises"
            },
            {
                "type": "website",
                "title": "YouTube Educational Channels",
                "url": "https://www.youtube.com/results?search_query=study+with+me",
                "description": "Study with me videos and subject-specific tutorials"
            },
            {
                "type": "website",
                "title": "Coursera",
                "url": "https://www.coursera.org/",
                "description": "Free online courses from top universities"
            },
            {
                "type": "website",
                "title": "edX",
                "url": "https://www.edx.org/",
                "description": "Free online courses and tutorials"
            }
            ]
        
        # Add subject-specific resources
        if subject.lower() in ["mathematics", "math", "calculus", "algebra"]:
            resources.extend([
                {
                    "type": "video",
                    "title": "3Blue1Brown",
                    "url": "https://www.youtube.com/c/3blue1brown",
                    "description": "Excellent math visualization and explanations"
                },
                {
                    "type": "website",
                    "title": "Wolfram Alpha",
                    "url": "https://www.wolframalpha.com/",
                    "description": "Step-by-step math problem solving"
                }
            ])
        elif subject.lower() in ["physics", "chemistry", "biology"]:
            resources.extend([
                {
                    "type": "video",
                    "title": "Crash Course",
                    "url": "https://www.youtube.com/c/crashcourse",
                    "description": "Engaging science tutorials and explanations"
                },
                {
                    "type": "website",
                    "title": "PhET Simulations",
                    "url": "https://phet.colorado.edu/",
                    "description": "Interactive science simulations"
                }
            ])
        
        schedule = {
            "dailyGoals": [
                "Set specific daily study targets",
                "Review previous day's progress",
                "Plan next day's tasks"
            ],
            "weeklyMilestones": [
                "Complete research phase",
                "Finish first draft",
                "Complete final review"
            ],
            "timeManagement": f"Use Pomodoro technique: 25 minutes focused work, 5 minutes break. Schedule {assignment_type.lower()} work during your peak productivity hours."
        }
        
        return {
            "subtasks": subtasks,
            "resources": resources,
            "tips": tips,
            "urgencyLevel": urgency_level,
            "schedule": schedule,
            "subjectSpecificAdvice": self._get_subject_specific_advice(subject, assignment_type)
        }
    
    def _get_subject_resources(self, subject: str) -> list:
        """Get subject-specific learning resources"""
        subject_lower = subject.lower()
        if "math" in subject_lower or "calculus" in subject_lower or "algebra" in subject_lower:
            return ["Khan Academy Math", "3Blue1Brown YouTube", "Wolfram Alpha", "IXL Math Practice"]
        elif "physics" in subject_lower:
            return ["Khan Academy Physics", "Crash Course Physics", "PhET Simulations", "MIT OpenCourseWare"]
        elif "chemistry" in subject_lower:
            return ["Khan Academy Chemistry", "Crash Course Chemistry", "PhET Chemistry Sims", "ACS Chemistry Resources"]
        elif "biology" in subject_lower:
            return ["Khan Academy Biology", "Crash Course Biology", "Amoeba Sisters", "HHMI BioInteractive"]
        elif "english" in subject_lower or "writing" in subject_lower or "essay" in subject_lower:
            return ["Purdue OWL", "Grammarly", "Hemingway Editor", "Writing Center Resources"]
        elif "history" in subject_lower:
            return ["Crash Course History", "Khan Academy History", "BBC History", "History Channel"]
        else:
            return ["Khan Academy", "YouTube Educational Channels", "Coursera", "edX"]
    
    def _get_assignment_strategies(self, assignment_type: str) -> list:
        """Get assignment type specific strategies"""
        assignment_lower = assignment_type.lower()
        if "essay" in assignment_lower:
            return ["Essay writing templates", "Thesis statement guides", "Citation tools", "Peer review guidelines"]
        elif "presentation" in assignment_lower:
            return ["Presentation design principles", "Public speaking tips", "Visual aid guidelines", "Rehearsal techniques"]
        elif "project" in assignment_lower:
            return ["Project planning tools", "Timeline templates", "Collaboration guidelines", "Presentation prep"]
        elif "exam" in assignment_lower or "quiz" in assignment_lower:
            return ["Study guides", "Practice tests", "Flashcard apps", "Test-taking strategies"]
        elif "homework" in assignment_lower:
            return ["Problem-solving strategies", "Step-by-step guides", "Practice exercises", "Concept review"]
        else:
            return ["General assignment guides", "Time management tools", "Study techniques", "Quality checklists"]
    
    def _get_subject_specific_advice(self, subject: str, assignment_type: str) -> str:
        """Get subject-specific study advice"""
        subject_lower = subject.lower()
        assignment_lower = assignment_type.lower()
        
        if "math" in subject_lower:
            return "Practice problems daily. Focus on understanding concepts, not just memorizing formulas. Use visual aids and step-by-step problem solving."
        elif "physics" in subject_lower:
            return "Understand the underlying principles first. Practice with real-world applications. Use diagrams and visual representations."
        elif "chemistry" in subject_lower:
            return "Memorize key concepts and practice balancing equations. Use molecular models and periodic table effectively."
        elif "biology" in subject_lower:
            return "Focus on understanding processes and relationships. Use diagrams and flowcharts. Practice with real examples."
        elif "english" in subject_lower or "writing" in assignment_lower:
            return "Plan your essay structure before writing. Use clear topic sentences and transitions. Revise for clarity and flow."
        elif "presentation" in assignment_lower:
            return "Practice your presentation multiple times. Use visual aids effectively. Focus on clear communication and audience engagement."
        else:
            return "Break down complex topics into smaller parts. Use active learning techniques. Review and practice regularly."
    
    def _get_basic_breakdown(self) -> Dict:
        """Return a basic breakdown as fallback"""
        return {
            "subtasks": [
                {"title": "Research", "description": "Gather information", "estimatedHours": 2, "priority": "medium"},
                {"title": "Planning", "description": "Create outline", "estimatedHours": 1, "priority": "medium"},
                {"title": "Execution", "description": "Complete work", "estimatedHours": 4, "priority": "medium"},
                {"title": "Review", "description": "Finalize", "estimatedHours": 1, "priority": "medium"}
            ],
            "resources": [
                "Academic databases",
                "Writing guidelines",
                "Citation tools"
            ],
            "tips": [
                "Break work into manageable chunks",
                "Set intermediate deadlines",
                "Allow time for unexpected issues"
            ],
            "urgencyLevel": "MEDIUM",
            "urgencyAdvice": "Standard task breakdown"
        } 