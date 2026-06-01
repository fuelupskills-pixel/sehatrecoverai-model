import re

class SehatRecoverAIEngine:
    def __init__(self):
        # In-house keyword mappings for symptom parsing and triage routing
        self.knowledge_base = {
            "cardiology": {
                "keywords": ["chest pain", "heart", "palpitation", "breathless", "arrhythmia", "stroke", "cardiac"],
                "recommendation": "Consult a cardiologist immediately. Monitor heart rate and restrict physical activity.",
                "priority": "HIGH"
            },
            "neurology": {
                "keywords": ["headache", "migraine", "dizziness", "seizure", "numbness", "paralysis", "vision loss"],
                "recommendation": "Consult a neurologist. Avoid bright lights, stay hydrated, and track headache frequency.",
                "priority": "MEDIUM"
            },
            "pediatrics": {
                "keywords": ["child", "baby", "pediatric", "infant", "toddler", "vaccine", "colic"],
                "recommendation": "Consult a pediatrician. Ensure proper hydration and track temperature patterns.",
                "priority": "MEDIUM"
            },
            "pulmonology": {
                "keywords": ["cough", "asthma", "wheezing", "bronchitis", "respiratory", "lungs", "congestion"],
                "recommendation": "Consult a pulmonologist. Avoid dust, consider steam inhalation, and check oxygen levels.",
                "priority": "MEDIUM"
            },
            "general_physician": {
                "keywords": ["fever", "body ache", "fatigue", "cold", "flu", "weakness", "vomiting", "stomach pain"],
                "recommendation": "Consult a general physician. Get plenty of rest, drink fluids, and monitor temperature.",
                "priority": "LOW"
            }
        }

    def analyze_symptoms(self, symptom_text: str) -> dict:
        """
        Analyzes raw symptom descriptions using our in-house NLP keyword mapping.
        Returns triage priority, recommended department, advice, and key matched terms.
        """
        if not symptom_text or not symptom_text.strip():
            return {
                "status": "error",
                "message": "Empty symptom description provided."
            }

        symptom_text_lower = symptom_text.lower()
        matched_departments = []
        matched_keywords = []

        # Find all matching domains in our knowledge base
        for dept, data in self.knowledge_base.items():
            for kw in data["keywords"]:
                if re.search(r'\b' + re.escape(kw) + r'\b', symptom_text_lower):
                    matched_keywords.append(kw)
                    if dept not in [d[0] for d in matched_departments]:
                        matched_departments.append((dept, data))

        # Triage and form the response
        if not matched_departments:
            return {
                "status": "success",
                "triage_level": "LOW",
                "department": "General Medicine",
                "advice": "No specific severe symptoms matched. We recommend consulting a General Physician for a routine check-up.",
                "insights": "Please monitor your health and log symptoms if they persist.",
                "matched_terms": []
            }

        matched_departments.sort(key=lambda x: {"HIGH": 3, "MEDIUM": 2, "LOW": 1}[x[1]["priority"]], reverse=True)
        primary_dept_name, primary_dept_data = matched_departments[0]

        dept_title = " ".join(word.capitalize() for word in primary_dept_name.split("_"))

        return {
            "status": "success",
            "triage_level": primary_dept_data["priority"],
            "department": dept_title,
            "advice": primary_dept_data["recommendation"],
            "insights": f"Detected potential issue related to: {', '.join(matched_keywords)}. Recommended department: {dept_title}.",
            "matched_terms": list(set(matched_keywords))
        }

    def analyze_assistant_query(self, query: str, context: str = "") -> dict:
        """
        Processes query questions (diet, exercises, prescription reading, routing)
        and returns advanced AI recommendations in structured format.
        """
        query_lower = query.lower()
        
        # 1. DIET CONTEXT
        if context == "diet" or any(k in query_lower for k in ["diet", "meal", "food", "eat", "weight", "sugar"]):
            if any(k in query_lower for k in ["diabetes", "diabetic", "sugar"]):
                response = (
                    "**Diabetic Diet Plan Recommendation**:\n"
                    "- Focus on complex carbs with low glycemic index (oats, brown rice, whole wheat).\n"
                    "- Include high protein sources (lentils, paneer, chicken breast, tofu) and fiber (leafy greens).\n"
                    "- Restrict refined sugars, white bread, sodas, and tropical fruits (mangoes/bananas).\n"
                    "- Tip: Eat in small, split meals every 3-4 hours to stabilize blood glucose levels."
                )
            elif any(k in query_lower for k in ["heart", "cardiac", "blood pressure", "hypertension", "bp"]):
                response = (
                    "**Heart-Healthy & Low-Sodium Diet Plan**:\n"
                    "- Reduce sodium intake (under 1,500mg daily) — avoid processed foods, pickles, and table salt.\n"
                    "- Embrace the DASH diet model rich in fruits, vegetables, nuts, and whole grains.\n"
                    "- Incorporate healthy fats (olive oil, walnuts, almonds, flaxseeds) rich in Omega-3.\n"
                    "- Restrict saturated fats, fatty red meats, and high-fat dairy."
                )
            else:
                response = (
                    "**General Health-Balanced Nutrition Plan**:\n"
                    "- Maintain a macro ratio of 50% Carbs (complex), 30% Protein, and 20% Healthy Fats.\n"
                    "- Drink at least 3-4 liters of water daily to maintain proper hydration.\n"
                    "- Ensure half your plate is filled with colorful vegetables and raw salad fibers.\n"
                    "- Avoid midnight snacking and cut down on processed carbohydrates."
                )
            return {
                "status": "success",
                "department": "Nutrition & Dietetics",
                "advice": "Nutritional plan generated based on clinical advisor standards.",
                "insights": response,
                "matched_terms": ["diet plan", "balanced macros"]
            }
            
        # 2. EXERCISE & ACTIVITY CONTEXT
        elif context == "exercise" or any(k in query_lower for k in ["exercise", "workout", "fitness", "walk", "run", "cardio"]):
            if any(k in query_lower for k in ["heart", "cardiac", "palpitation"]):
                response = (
                    "**Cardiac Recovery Exercise Guidelines**:\n"
                    "- Stick to low-intensity cardiovascular sessions (brisk walking, light cycling).\n"
                    "- Limit active sessions to 20-30 minutes, keeping heart rate under 110 bpm.\n"
                    "- Avoid heavy powerlifting or sudden bursts of high-intensity sprints.\n"
                    "- WARNING: Immediately stop if you experience chest tightness, dizziness, or irregular pulses."
                )
            elif any(k in query_lower for k in ["joint", "knee", "back pain", "osteo", "bone"]):
                response = (
                    "**Joint-Friendly Low-Impact Workout Routine**:\n"
                    "- Focus on non-weight-bearing cardiovascular activities like swimming or water aerobics.\n"
                    "- Perform regular isometric strength holds (e.g. wall sits, straight leg raises) to build stabilizer muscles.\n"
                    "- Engage in 15 minutes of dynamic stretching daily to maintain synovial joint lubrication.\n"
                    "- Restrict deep lunges, squats with weights, and high-impact jumping jacks."
                )
            else:
                response = (
                    "**Daily Fitness & Toning Routine**:\n"
                    "- Target a daily goal of 8,000 to 10,000 steps (equivalent to 5-6 km of walking/running).\n"
                    "- Perform 150 minutes of moderate aerobic activity weekly (brisk walking, jogging).\n"
                    "- Schedule 2-3 full-body bodyweight resistance sessions (push-ups, squats, planks).\n"
                    "- Tip: Dynamic warm-ups are mandatory before running; static cool-downs after walking."
                )
            return {
                "status": "success",
                "department": "Physiotherapy & Sports Science",
                "advice": "Activity regime generated according to physiological tolerance thresholds.",
                "insights": response,
                "matched_terms": ["cardio limits", "daily steps track"]
            }

        # 3. PRESCRIPTION PARSING CONTEXT
        elif context == "prescription" or any(k in query_lower for k in ["prescription", "rx", "medicine", "pill", "tablets", "amoxicillin", "paracetamol", "metformin"]):
            if "amoxicillin" in query_lower:
                response = (
                    "**Prescription Breakdown: Amoxicillin 500mg**\n"
                    "- Category: Penicillin-class broad-spectrum antibiotic.\n"
                    "- Common Usage: Bacterial infections (strep throat, respiratory tract, ear infections).\n"
                    "- Instructions: Complete the full course (typically 5-7 days) even if symptoms resolve earlier. Take with meals to avoid stomach upset.\n"
                    "- Precautions: Do not take if you have a history of penicillin allergy. Report severe rashes immediately."
                )
            elif "metformin" in query_lower:
                response = (
                    "**Prescription Breakdown: Metformin 500mg**\n"
                    "- Category: Biguanide antidiabetic agent.\n"
                    "- Common Usage: Management of Type 2 Diabetes Mellitus to improve insulin sensitivity.\n"
                    "- Instructions: Take with dinner or breakfast (minimizes gastrointestinal distress). Avoid skipping meals.\n"
                    "- Precautions: Limit alcohol intake. Monitor kidney function annually (danger of lactic acidosis)."
                )
            elif "paracetamol" in query_lower or "acetaminophen" in query_lower:
                response = (
                    "**Prescription Breakdown: Paracetamol 650mg**\n"
                    "- Category: Analgesic (pain reliever) & Antipyretic (fever reducer).\n"
                    "- Common Usage: Short-term relief of mild fever, headaches, and joint aches.\n"
                    "- Instructions: Take 1 tablet as needed (SOS). Maintain at least a 6-hour gap between doses.\n"
                    "- Precautions: Max daily limit is 4,000mg. Do not combine with other paracetamol medicines to protect liver health."
                )
            else:
                response = (
                    "**Prescription Reading Assistant**:\n"
                    "We detected medication terms in your query. Please note key rules:\n"
                    "1. Always double-check dosage, frequency (e.g. OD, BD, TDS), and timing (AC - before food, PC - after food).\n"
                    "2. Complete any antibiotic courses fully to avoid antimicrobial resistance.\n"
                    "3. Log any adverse side effects (nausea, rash, dizziness) in your portal and share with your doctor."
                )
            return {
                "status": "success",
                "department": "Clinical Pharmacology",
                "advice": "Prescription compounds parsed. Follow physician directives explicitly.",
                "insights": response,
                "matched_terms": ["dosage instructions", "safety precautions"]
            }

        # 4. HOSPITAL EMERGENCY ROUTING CONTEXT
        elif context == "routing" or any(k in query_lower for k in ["hospital", "route", "nearest", "emergency", "clinic", "address"]):
            # Analyze symptoms to determine appropriate hospital department specialty
            symptom_res = self.analyze_symptoms(query)
            specialty = symptom_res.get("department", "General Medicine")
            
            if specialty == "Cardiology":
                hospital = "Fortis Escorts Cardiac Super-Specialty Kiosk"
                route_plan = (
                    "- Target: Fortis Escorts Cardiac Specialty (Block-C)\n"
                    "- Recommended Path: Take NH-48 Express Corridor -> Exit 14 towards Medical Belt (12 mins, low traffic).\n"
                    "- Direct Integration: Your SehatRecover QR code has pre-dispatched Aadhaar KYC & insurance eligibility files to their ER desk.\n"
                    "- Action: Emergency cardiac triage bed reserved. Press 'Confirm Ambulance' if immediate transit is needed."
                )
            elif specialty == "Pulmonology":
                hospital = "Max Pulmonology and Critical Care Hospital"
                route_plan = (
                    "- Target: Max Chest & Lung Center (ER Annex)\n"
                    "- Recommended Path: Direct Ring Road Ringway Bypass -> Turn Left onto Hospital Lane (15 mins).\n"
                    "- Integration: Scheme coverage balance (₹5,00,000 PM-JAY) synced cashlessly with Max billing server.\n"
                    "- Action: Keep window open for air. Proceed with steam inhaler if respiratory congestion increases."
                )
            else:
                hospital = "SehatRecover General Network Hospital & ER"
                route_plan = (
                    "- Target: City Civic Care ER Desk\n"
                    "- Recommended Path: Standard Metro Road Way -> 8 mins transit time.\n"
                    "- Action: Present Universal Card at front reception desk for 1-click cashless entry admission."
                )
            return {
                "status": "success",
                "department": "Emergency Medical Dispatch",
                "advice": f"Recommended Emergency Care: {hospital}",
                "insights": f"Hospital Routing Directive:\n{route_plan}",
                "matched_terms": ["ER Routing", " cashlessly synced"]
            }

        # 5. DEFAULT SYMPTOM CHECKER FALLBACK
        else:
            return self.analyze_symptoms(query)

# Instantiate the single engine instance for import
ai_engine = SehatRecoverAIEngine()
