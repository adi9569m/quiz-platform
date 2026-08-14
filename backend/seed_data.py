import sys
import os
from datetime import datetime

# Allow running standalone
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import Category, Quiz, Question, QuestionOption, STATUS_DRAFT

SEED_CATEGORIES = [
    {"name": "Geography", "description": "Questions related to physical and human geography around the world and India."},
    {"name": "Indian History", "description": "Questions related to ancient, medieval, and modern Indian history."},
    {"name": "Programming", "description": "Questions on basic to intermediate programming concepts, HTML, CSS, JS, SQL, and data structures."},
    {"name": "General Knowledge", "description": "General knowledge questions covering diverse topics and current affairs."},
    {"name": "Trivia", "description": "A fun mix of geography, science, history, food & drink, and animals trivia questions."}
]

SEED_QUIZZES = [
    {
        "title": "Geography Quiz",
        "category_name": "Geography",
        "description": "Comprehensive quiz on Indian and World Geography.",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    },
    {
        "title": "Indian History Quiz",
        "category_name": "Indian History",
        "description": "Test your knowledge on ancient, medieval, and modern Indian history.",
        "difficulty": "MEDIUM",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    },
    {
        "title": "Programming Fundamentals",
        "category_name": "Programming",
        "description": "Easy to medium programming questions covering Python, web development, data structures, and algorithms.",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    },
    {
        "title": "General Knowledge Quiz",
        "category_name": "General Knowledge",
        "description": "General knowledge questions covering various topics across India and the world.",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    },
    {
        "title": "Mixed Trivia",
        "category_name": "Trivia",
        "description": "Mixed trivia containing questions on geography, science, history, food, and animals.",
        "difficulty": "EASY",
        "duration": 30,
        "passing_score": 40,
        "max_attempts": 3,
    },
]

# 100 Questions Data
SEED_QUESTIONS = {
    "Geography Quiz": [
        {
            "text": "Which one of the following is not correctly matched?",
            "options": [
                {"key": "A", "text": "Darjeeling - West Bengal", "is_correct": False},
                {"key": "B", "text": "Mount Abu - Rajasthan", "is_correct": False},
                {"key": "C", "text": "Kodaikanal - Tamil Nadu", "is_correct": False},
                {"key": "D", "text": "Simla - Uttar Pradesh", "is_correct": True},
            ]
        },
        {
            "text": "Consider the following pairs:\n\nTributary — Main River\n\n1. Chambal — Yamuna\n2. Sone — Narmada\n3. Manas — Brahmputra\n\nWhich one of the pairs given above is/are correctly matched?",
            "options": [
                {"key": "A", "text": "1, 2 and 3", "is_correct": True},
                {"key": "B", "text": "1 and 2 only", "is_correct": False},
                {"key": "C", "text": "2 and 3 only", "is_correct": False},
                {"key": "D", "text": "Only 3", "is_correct": False},
            ]
        },
        {
            "text": "The total population divided by available arable land area is referred to as:",
            "options": [
                {"key": "A", "text": "Population density", "is_correct": True},
                {"key": "B", "text": "Nutritional density", "is_correct": False},
                {"key": "C", "text": "Agricultural density", "is_correct": False},
                {"key": "D", "text": "Industrial density", "is_correct": False},
            ]
        },
        {
            "text": "Spot the odd one from the following:",
            "options": [
                {"key": "A", "text": "Tsunami", "is_correct": False},
                {"key": "B", "text": "Earthquakes", "is_correct": False},
                {"key": "C", "text": "Windmills", "is_correct": True},
                {"key": "D", "text": "Cyclones", "is_correct": False},
            ]
        },
        {
            "text": "Which one of the following though called a garden is in fact, not a garden?",
            "options": [
                {"key": "A", "text": "Vrindavan Garden of Mysore", "is_correct": False},
                {"key": "B", "text": "Hanging Garden of Mumbai", "is_correct": False},
                {"key": "C", "text": "Eden Garden of Kolkata", "is_correct": True},
                {"key": "D", "text": "Shalimar Garden of Kashmir", "is_correct": False},
            ]
        },
        {
            "text": "Maps on large scale, representing both natural and man-made features are called:",
            "options": [
                {"key": "A", "text": "Topographic maps", "is_correct": True},
                {"key": "B", "text": "Thematic maps", "is_correct": False},
                {"key": "C", "text": "Atlas maps", "is_correct": False},
                {"key": "D", "text": "Wall maps", "is_correct": False},
            ]
        },
        {
            "text": "Which river in India flows in a rift-valley?",
            "options": [
                {"key": "A", "text": "Tapti", "is_correct": False},
                {"key": "B", "text": "Narmada", "is_correct": True},
                {"key": "C", "text": "Krishna", "is_correct": False},
                {"key": "D", "text": "Cauvery", "is_correct": False},
            ]
        },
        {
            "text": "Apatani are the major tribal group of:",
            "options": [
                {"key": "A", "text": "Nagaland", "is_correct": False},
                {"key": "B", "text": "Sikkim", "is_correct": False},
                {"key": "C", "text": "Arunachal Pradesh", "is_correct": True},
                {"key": "D", "text": "Jharkhand", "is_correct": False},
            ]
        },
        {
            "text": "The angle between the magnetic meridian and the geographical meridian at a place is:",
            "options": [
                {"key": "A", "text": "Dip", "is_correct": False},
                {"key": "B", "text": "Declination", "is_correct": True},
                {"key": "C", "text": "Latitude", "is_correct": False},
                {"key": "D", "text": "Azimuth", "is_correct": False},
            ]
        },
        {
            "text": "Which one of the following pairs is wrongly matched?",
            "options": [
                {"key": "A", "text": "Red Square - Moscow", "is_correct": False},
                {"key": "B", "text": "Tiananmen Square - Beijing", "is_correct": False},
                {"key": "C", "text": "Tahrir Square - Abu Dhabi", "is_correct": True},
                {"key": "D", "text": "Trafalgar Square - London", "is_correct": False},
            ]
        },
        {
            "text": "Tembhli village which was in news is in:",
            "options": [
                {"key": "A", "text": "Bihar", "is_correct": False},
                {"key": "B", "text": "Rajasthan", "is_correct": False},
                {"key": "C", "text": "Orissa", "is_correct": False},
                {"key": "D", "text": "Maharashtra", "is_correct": True},
            ]
        },
        {
            "text": "'Bhagyam Oilfields' which were recently in news, are located in which of the following states in India?",
            "options": [
                {"key": "A", "text": "Rajasthan", "is_correct": True},
                {"key": "B", "text": "Gujarat", "is_correct": False},
                {"key": "C", "text": "Assam", "is_correct": False},
                {"key": "D", "text": "Maharashtra", "is_correct": False},
            ]
        },
        {
            "text": "As per Census 2011, which of the following Indian states has the lowest population density?",
            "options": [
                {"key": "A", "text": "Nagaland", "is_correct": False},
                {"key": "B", "text": "Manipur", "is_correct": False},
                {"key": "C", "text": "Arunachal Pradesh", "is_correct": True},
                {"key": "D", "text": "Himachal Pradesh", "is_correct": False},
            ]
        },
        {
            "text": "Cheraw, the Bamboo Dance, is of which Indian state?",
            "options": [
                {"key": "A", "text": "Mizoram", "is_correct": True},
                {"key": "B", "text": "Sikkim", "is_correct": False},
                {"key": "C", "text": "Arunachal Pradesh", "is_correct": False},
                {"key": "D", "text": "Manipur", "is_correct": False},
            ]
        },
        {
            "text": "Which of the following is the Capital of Madhya Pradesh?",
            "options": [
                {"key": "A", "text": "Indore", "is_correct": False},
                {"key": "B", "text": "Lucknow", "is_correct": False},
                {"key": "C", "text": "Dehradun", "is_correct": False},
                {"key": "D", "text": "Bhopal", "is_correct": True},
            ]
        },
        {
            "text": "Kabul is a town in:",
            "options": [
                {"key": "A", "text": "Pakistan", "is_correct": False},
                {"key": "B", "text": "Nepal", "is_correct": False},
                {"key": "C", "text": "Bhutan", "is_correct": False},
                {"key": "D", "text": "Afghanistan", "is_correct": True},
            ]
        },
        {
            "text": "'Bhagyam Oilfields' which were recently in news are located in which of the following states in India?",
            "options": [
                {"key": "A", "text": "Rajasthan", "is_correct": True},
                {"key": "B", "text": "Gujarat", "is_correct": False},
                {"key": "C", "text": "Assam", "is_correct": False},
                {"key": "D", "text": "Maharashtra", "is_correct": False},
            ]
        },
        {
            "text": "Which of the following is known as the City of Lakes?",
            "options": [
                {"key": "A", "text": "Chandigarh", "is_correct": False},
                {"key": "B", "text": "Nasik", "is_correct": False},
                {"key": "C", "text": "Udaipur", "is_correct": True},
                {"key": "D", "text": "Ranchi", "is_correct": False},
            ]
        },
        {
            "text": "The short-term variations of the atmosphere, ranging from minutes to months are called:",
            "options": [
                {"key": "A", "text": "Climate", "is_correct": False},
                {"key": "B", "text": "Weather", "is_correct": True},
                {"key": "C", "text": "Temperature", "is_correct": False},
                {"key": "D", "text": "Humidity", "is_correct": False},
            ]
        },
        {
            "text": "The warmest sea amongst the following is:",
            "options": [
                {"key": "A", "text": "Tasman Sea", "is_correct": False},
                {"key": "B", "text": "Baltic Sea", "is_correct": False},
                {"key": "C", "text": "Beaufort Sea", "is_correct": False},
                {"key": "D", "text": "Red Sea", "is_correct": True},
            ]
        },
    ],
    "Indian History Quiz": [
        {
            "text": "Tools like cleavers and choppers are used in which age?",
            "options": [
                {"key": "A", "text": "Neolithic Age", "is_correct": False},
                {"key": "B", "text": "Mesolithic Age", "is_correct": False},
                {"key": "C", "text": "Paleolithic Age", "is_correct": True},
                {"key": "D", "text": "Miolithic Age", "is_correct": False},
            ]
        },
        {
            "text": "What are the gold coins used by Aryans called?",
            "options": [
                {"key": "A", "text": "Mishmi", "is_correct": False},
                {"key": "B", "text": "Ksharpana", "is_correct": False},
                {"key": "C", "text": "Torana", "is_correct": False},
                {"key": "D", "text": "Nishka", "is_correct": True},
            ]
        },
        {
            "text": "One of the Vedangas, Kalpa deals with which subject?",
            "options": [
                {"key": "A", "text": "Phonetics", "is_correct": False},
                {"key": "B", "text": "Rituals and ceremonies", "is_correct": True},
                {"key": "C", "text": "Metrics", "is_correct": False},
                {"key": "D", "text": "Etymology", "is_correct": False},
            ]
        },
        {
            "text": "Who founded the Magadha empire?",
            "options": [
                {"key": "A", "text": "Brihadratha", "is_correct": True},
                {"key": "B", "text": "Udayin", "is_correct": False},
                {"key": "C", "text": "Kalashoka", "is_correct": False},
                {"key": "D", "text": "Ajatashatru", "is_correct": False},
            ]
        },
        {
            "text": "When did Alexander invade India?",
            "options": [
                {"key": "A", "text": "226 B.C.", "is_correct": False},
                {"key": "B", "text": "126 B.C.", "is_correct": False},
                {"key": "C", "text": "326 B.C.", "is_correct": True},
                {"key": "D", "text": "426 B.C.", "is_correct": False},
            ]
        },
        {
            "text": "In which rock edict of Ashoka was the Kalinga war mentioned?",
            "options": [
                {"key": "A", "text": "11th Rock Edict", "is_correct": False},
                {"key": "B", "text": "13th Rock Edict", "is_correct": True},
                {"key": "C", "text": "15th Rock Edict", "is_correct": False},
                {"key": "D", "text": "10th Rock Edict", "is_correct": False},
            ]
        },
        {
            "text": "How much portion of the land produce was collected by Cholas as tax?",
            "options": [
                {"key": "A", "text": "1/6th", "is_correct": True},
                {"key": "B", "text": "1/8th", "is_correct": False},
                {"key": "C", "text": "1/9th", "is_correct": False},
                {"key": "D", "text": "1/5th", "is_correct": False},
            ]
        },
        {
            "text": "Ibn Batuta, a Moorish traveller, visited India during the reign of which ruler?",
            "options": [
                {"key": "A", "text": "Firuz Shah Tughlaq", "is_correct": False},
                {"key": "B", "text": "Muhammad Khilji", "is_correct": False},
                {"key": "C", "text": "Muhammad-bin-Tughlaq", "is_correct": True},
                {"key": "D", "text": "Alauddin Khilji", "is_correct": False},
            ]
        },
        {
            "text": "According to the Saptanga theory of Kautilya/Chanakya, who is Amatya in Mauryan administration?",
            "options": [
                {"key": "A", "text": "Revenue collector", "is_correct": False},
                {"key": "B", "text": "Financial advisor", "is_correct": False},
                {"key": "C", "text": "Treasurer", "is_correct": False},
                {"key": "D", "text": "Secretary", "is_correct": True},
            ]
        },
        {
            "text": "Navaratnas existed in the court of which Mughal ruler?",
            "options": [
                {"key": "A", "text": "Humayun", "is_correct": False},
                {"key": "B", "text": "Jahangir", "is_correct": False},
                {"key": "C", "text": "Akbar", "is_correct": True},
                {"key": "D", "text": "Babur", "is_correct": False},
            ]
        },
        {
            "text": "Which land revenue system was introduced in Madras by the Britishers?",
            "options": [
                {"key": "A", "text": "Zamindari system", "is_correct": False},
                {"key": "B", "text": "Ryotwari system", "is_correct": True},
                {"key": "C", "text": "Mahalwari system", "is_correct": False},
                {"key": "D", "text": "None of the above", "is_correct": False},
            ]
        },
        {
            "text": "During which dynasty's rule was the Amaravati School of Art developed?",
            "options": [
                {"key": "A", "text": "Mauryans", "is_correct": False},
                {"key": "B", "text": "Mughals", "is_correct": False},
                {"key": "C", "text": "Satavahanas", "is_correct": True},
                {"key": "D", "text": "Kushanas", "is_correct": False},
            ]
        },
        {
            "text": "In which year did the French colonial rule in Pondicherry and Yanam come to an end?",
            "options": [
                {"key": "A", "text": "1954", "is_correct": True},
                {"key": "B", "text": "1964", "is_correct": False},
                {"key": "C", "text": "1974", "is_correct": False},
                {"key": "D", "text": "1984", "is_correct": False},
            ]
        },
        {
            "text": "Who was the first Governor-General of independent India?",
            "options": [
                {"key": "A", "text": "Lord Cornwallis", "is_correct": False},
                {"key": "B", "text": "Lord Wavell", "is_correct": False},
                {"key": "C", "text": "Lord Hardinge", "is_correct": False},
                {"key": "D", "text": "Lord Mountbatten", "is_correct": True},
            ]
        },
        {
            "text": "Who won the Battle of Chausa and became the emperor of India?",
            "options": [
                {"key": "A", "text": "Sher Shah Suri", "is_correct": True},
                {"key": "B", "text": "Akbar", "is_correct": False},
                {"key": "C", "text": "Humayun", "is_correct": False},
                {"key": "D", "text": "Jahangir", "is_correct": False},
            ]
        },
        {
            "text": "Who founded the English weekly named \"New India\"?",
            "options": [
                {"key": "A", "text": "Bal Gangadhar Tilak", "is_correct": False},
                {"key": "B", "text": "Lala Lajapati Rai", "is_correct": False},
                {"key": "C", "text": "Bipin Chandra Pal", "is_correct": True},
                {"key": "D", "text": "Mahatma Gandhi", "is_correct": False},
            ]
        },
        {
            "text": "Who remarked that the Government of India Act, 1935 was a \"new charter of slavery\"?",
            "options": [
                {"key": "A", "text": "Subhash Chandra Bose", "is_correct": False},
                {"key": "B", "text": "Jawaharlal Nehru", "is_correct": True},
                {"key": "C", "text": "Sardar Vallabhai Patel", "is_correct": False},
                {"key": "D", "text": "Motilal Nehru", "is_correct": False},
            ]
        },
        {
            "text": "When was the Interim Government of India formed?",
            "options": [
                {"key": "A", "text": "October 2, 1946", "is_correct": False},
                {"key": "B", "text": "August 2, 1946", "is_correct": False},
                {"key": "C", "text": "September 2, 1946", "is_correct": True},
                {"key": "D", "text": "December 2, 1946", "is_correct": False},
            ]
        },
        {
            "text": "Who was the chief advocate during the Indian National Army trial?",
            "options": [
                {"key": "A", "text": "Bhulabhai Desai", "is_correct": True},
                {"key": "B", "text": "Tej Bahadur Sapru", "is_correct": False},
                {"key": "C", "text": "Sarat Chandra Bose", "is_correct": False},
                {"key": "D", "text": "Asaf Ali", "is_correct": False},
            ]
        },
        {
            "text": "Which Indian freedom fighter succumbed to lathi charges during Simon Commission protests?",
            "options": [
                {"key": "A", "text": "Aurobindo Ghosh", "is_correct": False},
                {"key": "B", "text": "Lala Lajpat Rai", "is_correct": True},
                {"key": "C", "text": "Gopala Krishna Gokhale", "is_correct": False},
                {"key": "D", "text": "Ras Behari Ghosh", "is_correct": False},
            ]
        },
    ],
    "Programming Fundamentals": [
        {
            "text": "Which of the following is a programming language?",
            "options": [
                {"key": "A", "text": "HTML", "is_correct": False},
                {"key": "B", "text": "Python", "is_correct": True},
                {"key": "C", "text": "CSS", "is_correct": False},
                {"key": "D", "text": "JSON", "is_correct": False},
            ]
        },
        {
            "text": "Which symbol is commonly used for assignment in Python?",
            "options": [
                {"key": "A", "text": "==", "is_correct": False},
                {"key": "B", "text": "=", "is_correct": True},
                {"key": "C", "text": "!=", "is_correct": False},
                {"key": "D", "text": "=>", "is_correct": False},
            ]
        },
        {
            "text": "Which data type is used to store whole numbers in Python?",
            "options": [
                {"key": "A", "text": "float", "is_correct": False},
                {"key": "B", "text": "string", "is_correct": False},
                {"key": "C", "text": "int", "is_correct": True},
                {"key": "D", "text": "boolean", "is_correct": False},
            ]
        },
        {
            "text": "What is the output of print(2 + 3) in Python?",
            "options": [
                {"key": "A", "text": "4", "is_correct": False},
                {"key": "B", "text": "5", "is_correct": True},
                {"key": "C", "text": "6", "is_correct": False},
                {"key": "D", "text": "23", "is_correct": False},
            ]
        },
        {
            "text": "Which keyword is used to define a function in Python?",
            "options": [
                {"key": "A", "text": "function", "is_correct": False},
                {"key": "B", "text": "define", "is_correct": False},
                {"key": "C", "text": "def", "is_correct": True},
                {"key": "D", "text": "fun", "is_correct": False},
            ]
        },
        {
            "text": "Which data structure stores key-value pairs in Python?",
            "options": [
                {"key": "A", "text": "List", "is_correct": False},
                {"key": "B", "text": "Tuple", "is_correct": False},
                {"key": "C", "text": "Dictionary", "is_correct": True},
                {"key": "D", "text": "Set", "is_correct": False},
            ]
        },
        {
            "text": "Which operator is used to check equality in Python?",
            "options": [
                {"key": "A", "text": "=", "is_correct": False},
                {"key": "B", "text": "==", "is_correct": True},
                {"key": "C", "text": "!=", "is_correct": False},
                {"key": "D", "text": "===", "is_correct": False},
            ]
        },
        {
            "text": "What is the output of len(\"Hello\")?",
            "options": [
                {"key": "A", "text": "4", "is_correct": False},
                {"key": "B", "text": "5", "is_correct": True},
                {"key": "C", "text": "6", "is_correct": False},
                {"key": "D", "text": "0", "is_correct": False},
            ]
        },
        {
            "text": "Which loop is commonly used to iterate over a sequence in Python?",
            "options": [
                {"key": "A", "text": "repeat", "is_correct": False},
                {"key": "B", "text": "foreach", "is_correct": False},
                {"key": "C", "text": "for", "is_correct": True},
                {"key": "D", "text": "loop", "is_correct": False},
            ]
        },
        {
            "text": "Which keyword is used to stop a loop immediately?",
            "options": [
                {"key": "A", "text": "stop", "is_correct": False},
                {"key": "B", "text": "exit", "is_correct": False},
                {"key": "C", "text": "break", "is_correct": True},
                {"key": "D", "text": "return", "is_correct": False},
            ]
        },
        {
            "text": "What does HTML primarily define?",
            "options": [
                {"key": "A", "text": "Database structure", "is_correct": False},
                {"key": "B", "text": "Web page structure", "is_correct": True},
                {"key": "C", "text": "Programming logic", "is_correct": False},
                {"key": "D", "text": "Operating system", "is_correct": False},
            ]
        },
        {
            "text": "Which language is primarily used to style web pages?",
            "options": [
                {"key": "A", "text": "Python", "is_correct": False},
                {"key": "B", "text": "Java", "is_correct": False},
                {"key": "C", "text": "CSS", "is_correct": True},
                {"key": "D", "text": "SQL", "is_correct": False},
            ]
        },
        {
            "text": "Which language is commonly used to add interactivity to web pages?",
            "options": [
                {"key": "A", "text": "HTML", "is_correct": False},
                {"key": "B", "text": "CSS", "is_correct": False},
                {"key": "C", "text": "JavaScript", "is_correct": True},
                {"key": "D", "text": "SQL", "is_correct": False},
            ]
        },
        {
            "text": "What does SQL primarily work with?",
            "options": [
                {"key": "A", "text": "Images", "is_correct": False},
                {"key": "B", "text": "Databases", "is_correct": True},
                {"key": "C", "text": "Operating systems", "is_correct": False},
                {"key": "D", "text": "Web styling", "is_correct": False},
            ]
        },
        {
            "text": "Which SQL command is used to retrieve data from a table?",
            "options": [
                {"key": "A", "text": "INSERT", "is_correct": False},
                {"key": "B", "text": "DELETE", "is_correct": False},
                {"key": "C", "text": "SELECT", "is_correct": True},
                {"key": "D", "text": "UPDATE", "is_correct": False},
            ]
        },
        {
            "text": "Which data structure follows the FIFO principle?",
            "options": [
                {"key": "A", "text": "Stack", "is_correct": False},
                {"key": "B", "text": "Queue", "is_correct": True},
                {"key": "C", "text": "Tree", "is_correct": False},
                {"key": "D", "text": "Graph", "is_correct": False},
            ]
        },
        {
            "text": "Which data structure follows the LIFO principle?",
            "options": [
                {"key": "A", "text": "Queue", "is_correct": False},
                {"key": "B", "text": "Stack", "is_correct": True},
                {"key": "C", "text": "Array", "is_correct": False},
                {"key": "D", "text": "Graph", "is_correct": False},
            ]
        },
        {
            "text": "What is the purpose of an if statement?",
            "options": [
                {"key": "A", "text": "Repeat code", "is_correct": False},
                {"key": "B", "text": "Make a decision based on a condition", "is_correct": True},
                {"key": "C", "text": "Create a database", "is_correct": False},
                {"key": "D", "text": "Define a class", "is_correct": False},
            ]
        },
        {
            "text": "What does debugging mean?",
            "options": [
                {"key": "A", "text": "Writing documentation", "is_correct": False},
                {"key": "B", "text": "Finding and fixing errors in code", "is_correct": True},
                {"key": "C", "text": "Compiling hardware", "is_correct": False},
                {"key": "D", "text": "Designing a website", "is_correct": False},
            ]
        },
        {
            "text": "What is an algorithm?",
            "options": [
                {"key": "A", "text": "A programming language", "is_correct": False},
                {"key": "B", "text": "A step-by-step procedure for solving a problem", "is_correct": True},
                {"key": "C", "text": "A database", "is_correct": False},
                {"key": "D", "text": "A computer virus", "is_correct": False},
            ]
        },
    ],
    "General Knowledge Quiz": [
        {
            "text": "Lucknow is situated on the bank of which river?",
            "options": [
                {"key": "A", "text": "Ganga", "is_correct": False},
                {"key": "B", "text": "Gomti", "is_correct": True},
                {"key": "C", "text": "Musi", "is_correct": False},
                {"key": "D", "text": "Hugli", "is_correct": False},
            ]
        },
        {
            "text": "Kokrajhar is located in which state?",
            "options": [
                {"key": "A", "text": "Odisha", "is_correct": False},
                {"key": "B", "text": "West Bengal", "is_correct": False},
                {"key": "C", "text": "Sikkim", "is_correct": False},
                {"key": "D", "text": "Assam", "is_correct": True},
            ]
        },
        {
            "text": "Surajkund International Crafts Mela is located in:",
            "options": [
                {"key": "A", "text": "Haryana", "is_correct": True},
                {"key": "B", "text": "Rajasthan", "is_correct": False},
                {"key": "C", "text": "Gujarat", "is_correct": False},
                {"key": "D", "text": "New Delhi", "is_correct": False},
            ]
        },
        {
            "text": "Penna River originates in:",
            "options": [
                {"key": "A", "text": "Karnataka", "is_correct": True},
                {"key": "B", "text": "Tamil Nadu", "is_correct": False},
                {"key": "C", "text": "Andhra Pradesh", "is_correct": False},
                {"key": "D", "text": "Telangana", "is_correct": False},
            ]
        },
        {
            "text": "The Karakoram Pass connects which two countries?",
            "options": [
                {"key": "A", "text": "India and China", "is_correct": True},
                {"key": "B", "text": "India and Bhutan", "is_correct": False},
                {"key": "C", "text": "China and Bhutan", "is_correct": False},
                {"key": "D", "text": "China and Nepal", "is_correct": False},
            ]
        },
        {
            "text": "Which country was the first to launch an e-passport facility in the world?",
            "options": [
                {"key": "A", "text": "USA", "is_correct": False},
                {"key": "B", "text": "Japan", "is_correct": False},
                {"key": "C", "text": "UK", "is_correct": False},
                {"key": "D", "text": "Malaysia", "is_correct": True},
            ]
        },
        {
            "text": "Which of the following is the state flower of Odisha?",
            "options": [
                {"key": "A", "text": "Lily", "is_correct": False},
                {"key": "B", "text": "Rose", "is_correct": False},
                {"key": "C", "text": "Ashoka", "is_correct": True},
                {"key": "D", "text": "Dahlia", "is_correct": False},
            ]
        },
        {
            "text": "The world's first thermal battery power plant was located in:",
            "options": [
                {"key": "A", "text": "Visakhapatnam", "is_correct": False},
                {"key": "B", "text": "Hyderabad", "is_correct": False},
                {"key": "C", "text": "Tirupathi", "is_correct": False},
                {"key": "D", "text": "Amaravati", "is_correct": True},
            ]
        },
        {
            "text": "National Immunization Day is observed on:",
            "options": [
                {"key": "A", "text": "December 1st", "is_correct": False},
                {"key": "B", "text": "December 25th", "is_correct": False},
                {"key": "C", "text": "December 16th", "is_correct": False},
                {"key": "D", "text": "January 19th", "is_correct": True},
            ]
        },
        {
            "text": "Magh Bihu, a harvest festival, is celebrated in:",
            "options": [
                {"key": "A", "text": "Meghalaya", "is_correct": False},
                {"key": "B", "text": "Sikkim", "is_correct": False},
                {"key": "C", "text": "Assam", "is_correct": True},
                {"key": "D", "text": "Arunachal Pradesh", "is_correct": False},
            ]
        },
        {
            "text": "Mehrangarh Fort is located in which state?",
            "options": [
                {"key": "A", "text": "Rajasthan", "is_correct": True},
                {"key": "B", "text": "Madhya Pradesh", "is_correct": False},
                {"key": "C", "text": "Telangana", "is_correct": False},
                {"key": "D", "text": "Karnataka", "is_correct": False},
            ]
        },
        {
            "text": "Which Indian state was the largest producer of spices in 2019?",
            "options": [
                {"key": "A", "text": "Andhra Pradesh", "is_correct": False},
                {"key": "B", "text": "Karnataka", "is_correct": False},
                {"key": "C", "text": "Gujarat", "is_correct": False},
                {"key": "D", "text": "Rajasthan", "is_correct": True},
            ]
        },
        {
            "text": "The National Food Security Act was passed in which year?",
            "options": [
                {"key": "A", "text": "2012", "is_correct": False},
                {"key": "B", "text": "2013", "is_correct": True},
                {"key": "C", "text": "2011", "is_correct": False},
                {"key": "D", "text": "2010", "is_correct": False},
            ]
        },
        {
            "text": "Amravati district in Andhra Pradesh is situated on the bank of which river?",
            "options": [
                {"key": "A", "text": "Godavari", "is_correct": False},
                {"key": "B", "text": "Musi", "is_correct": False},
                {"key": "C", "text": "Krishna", "is_correct": True},
                {"key": "D", "text": "Narmada", "is_correct": False},
            ]
        },
        {
            "text": "Which animal is the state animal of Andhra Pradesh?",
            "options": [
                {"key": "A", "text": "Blackbuck", "is_correct": True},
                {"key": "B", "text": "Great Indian Bustard", "is_correct": False},
                {"key": "C", "text": "Indian Elephant", "is_correct": False},
                {"key": "D", "text": "One-Horned Rhinoceros", "is_correct": False},
            ]
        },
        {
            "text": "The term \"Golden Revolution\" is most closely related to which mission?",
            "options": [
                {"key": "A", "text": "National Mission on Clean Coal Technologies", "is_correct": False},
                {"key": "B", "text": "National Bamboo Mission", "is_correct": False},
                {"key": "C", "text": "National Solar Mission", "is_correct": False},
                {"key": "D", "text": "National Horticulture Mission", "is_correct": True},
            ]
        },
        {
            "text": "Which Indian petroleum company was in the news for the first hydrocarbon discovery in Sri Lanka?",
            "options": [
                {"key": "A", "text": "RIL", "is_correct": False},
                {"key": "B", "text": "Cairn India", "is_correct": True},
                {"key": "C", "text": "ONGC", "is_correct": False},
                {"key": "D", "text": "Essar Oil", "is_correct": False},
            ]
        },
        {
            "text": "Education Innovation Fund for India is an initiative of:",
            "options": [
                {"key": "A", "text": "Intel", "is_correct": False},
                {"key": "B", "text": "IBM", "is_correct": False},
                {"key": "C", "text": "Microsoft India", "is_correct": False},
                {"key": "D", "text": "Hewlett-Packard", "is_correct": True},
            ]
        },
        {
            "text": "The first nuclear test was conducted in India in:",
            "options": [
                {"key": "A", "text": "1973", "is_correct": False},
                {"key": "B", "text": "1974", "is_correct": True},
                {"key": "C", "text": "1975", "is_correct": False},
                {"key": "D", "text": "1976", "is_correct": False},
            ]
        },
        {
            "text": "The first shore-based, modern, integrated steel plant in India is in:",
            "options": [
                {"key": "A", "text": "Salem", "is_correct": False},
                {"key": "B", "text": "Haldia", "is_correct": False},
                {"key": "C", "text": "Mangalore", "is_correct": False},
                {"key": "D", "text": "Visakhapatnam", "is_correct": True},
            ]
        },
    ],
    "Mixed Trivia": [
        {
            "text": "Which is the national river of India?",
            "options": [
                {"key": "A", "text": "Yamuna", "is_correct": False},
                {"key": "B", "text": "Ganga", "is_correct": True},
                {"key": "C", "text": "Godavari", "is_correct": False},
                {"key": "D", "text": "Narmada", "is_correct": False},
            ]
        },
        {
            "text": "How many continents are there in the world?",
            "options": [
                {"key": "A", "text": "Five", "is_correct": False},
                {"key": "B", "text": "Six", "is_correct": False},
                {"key": "C", "text": "Seven", "is_correct": True},
                {"key": "D", "text": "Eight", "is_correct": False},
            ]
        },
        {
            "text": "What is the capital of India?",
            "options": [
                {"key": "A", "text": "Mumbai", "is_correct": False},
                {"key": "B", "text": "New Delhi", "is_correct": True},
                {"key": "C", "text": "Kolkata", "is_correct": False},
                {"key": "D", "text": "Chennai", "is_correct": False},
            ]
        },
        {
            "text": "Which is the tallest mountain in the world?",
            "options": [
                {"key": "A", "text": "K2", "is_correct": False},
                {"key": "B", "text": "Mount Everest", "is_correct": True},
                {"key": "C", "text": "Kanchenjunga", "is_correct": False},
                {"key": "D", "text": "Mount Kilimanjaro", "is_correct": False},
            ]
        },
        {
            "text": "Name the process by which plants prepare food.",
            "options": [
                {"key": "A", "text": "Respiration", "is_correct": False},
                {"key": "B", "text": "Digestion", "is_correct": False},
                {"key": "C", "text": "Photosynthesis", "is_correct": True},
                {"key": "D", "text": "Germination", "is_correct": False},
            ]
        },
        {
            "text": "Which planet is called the Red Planet?",
            "options": [
                {"key": "A", "text": "Venus", "is_correct": False},
                {"key": "B", "text": "Jupiter", "is_correct": False},
                {"key": "C", "text": "Mars", "is_correct": True},
                {"key": "D", "text": "Mercury", "is_correct": False},
            ]
        },
        {
            "text": "Which organ pumps blood?",
            "options": [
                {"key": "A", "text": "Brain", "is_correct": False},
                {"key": "B", "text": "Lungs", "is_correct": False},
                {"key": "C", "text": "Heart", "is_correct": True},
                {"key": "D", "text": "Kidney", "is_correct": False},
            ]
        },
        {
            "text": "What is the solid form of water?",
            "options": [
                {"key": "A", "text": "Steam", "is_correct": False},
                {"key": "B", "text": "Ice", "is_correct": True},
                {"key": "C", "text": "Rain", "is_correct": False},
                {"key": "D", "text": "Vapour", "is_correct": False},
            ]
        },
        {
            "text": "Who is known as the \"Father of our Nation\"?",
            "options": [
                {"key": "A", "text": "Jawaharlal Nehru", "is_correct": False},
                {"key": "B", "text": "Mahatma Gandhi", "is_correct": True},
                {"key": "C", "text": "Sardar Patel", "is_correct": False},
                {"key": "D", "text": "Subhas Chandra Bose", "is_correct": False},
            ]
        },
        {
            "text": "When did India get independence?",
            "options": [
                {"key": "A", "text": "1942", "is_correct": False},
                {"key": "B", "text": "1945", "is_correct": False},
                {"key": "C", "text": "1947", "is_correct": True},
                {"key": "D", "text": "1950", "is_correct": False},
            ]
        },
        {
            "text": "Who built the Taj Mahal?",
            "options": [
                {"key": "A", "text": "Akbar", "is_correct": False},
                {"key": "B", "text": "Shah Jahan", "is_correct": True},
                {"key": "C", "text": "Aurangzeb", "is_correct": False},
                {"key": "D", "text": "Babur", "is_correct": False},
            ]
        },
        {
            "text": "Who was the first Mughal ruler of India?",
            "options": [
                {"key": "A", "text": "Akbar", "is_correct": False},
                {"key": "B", "text": "Humayun", "is_correct": False},
                {"key": "C", "text": "Babur", "is_correct": True},
                {"key": "D", "text": "Shah Jahan", "is_correct": False},
            ]
        },
        {
            "text": "Eggs are rich in what?",
            "options": [
                {"key": "A", "text": "Protein", "is_correct": True},
                {"key": "B", "text": "Fibre", "is_correct": False},
                {"key": "C", "text": "Vitamin C", "is_correct": False},
                {"key": "D", "text": "Calcium", "is_correct": False},
            ]
        },
        {
            "text": "What do we obtain from cows?",
            "options": [
                {"key": "A", "text": "Honey", "is_correct": False},
                {"key": "B", "text": "Milk", "is_correct": True},
                {"key": "C", "text": "Eggs", "is_correct": False},
                {"key": "D", "text": "Wool", "is_correct": False},
            ]
        },
        {
            "text": "Which vegetable is commonly associated with improving eyesight?",
            "options": [
                {"key": "A", "text": "Potato", "is_correct": False},
                {"key": "B", "text": "Carrot", "is_correct": True},
                {"key": "C", "text": "Onion", "is_correct": False},
                {"key": "D", "text": "Cabbage", "is_correct": False},
            ]
        },
        {
            "text": "Which dish can be prepared very quickly and is commonly known for having a short preparation time?",
            "options": [
                {"key": "A", "text": "Biryani", "is_correct": False},
                {"key": "B", "text": "Pizza", "is_correct": False},
                {"key": "C", "text": "Maggi", "is_correct": True},
                {"key": "D", "text": "Dosa", "is_correct": False},
            ]
        },
        {
            "text": "Which animal is known as the king of the jungle?",
            "options": [
                {"key": "A", "text": "Tiger", "is_correct": False},
                {"key": "B", "text": "Lion", "is_correct": True},
                {"key": "C", "text": "Elephant", "is_correct": False},
                {"key": "D", "text": "Leopard", "is_correct": False},
            ]
        },
        {
            "text": "Which is the national animal of India?",
            "options": [
                {"key": "A", "text": "Lion", "is_correct": False},
                {"key": "B", "text": "Elephant", "is_correct": False},
                {"key": "C", "text": "Tiger", "is_correct": True},
                {"key": "D", "text": "Peacock", "is_correct": False},
            ]
        },
        {
            "text": "Which is the tallest animal?",
            "options": [
                {"key": "A", "text": "Elephant", "is_correct": False},
                {"key": "B", "text": "Giraffe", "is_correct": True},
                {"key": "C", "text": "Horse", "is_correct": False},
                {"key": "D", "text": "Camel", "is_correct": False},
            ]
        },
        {
            "text": "Which animal has a trunk?",
            "options": [
                {"key": "A", "text": "Rhinoceros", "is_correct": False},
                {"key": "B", "text": "Elephant", "is_correct": True},
                {"key": "C", "text": "Giraffe", "is_correct": False},
                {"key": "D", "text": "Zebra", "is_correct": False},
            ]
        },
    ]
}


def seed_categories():
    cat_map = {}
    for c_data in SEED_CATEGORIES:
        name = c_data["name"]
        cat = Category.query.filter(db.func.lower(Category.name) == name.lower()).first()
        if not cat:
            cat = Category(
                name=name,
                description=c_data["description"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.session.add(cat)
            db.session.flush()
        cat_map[name] = cat
    db.session.commit()
    return cat_map


def seed_quizzes(cat_map):
    quiz_map = {}
    for q_data in SEED_QUIZZES:
        title = q_data["title"]
        cat_name = q_data["category_name"]
        category = cat_map[cat_name]

        quiz = Quiz.query.filter_by(title=title).first()
        if not quiz:
            quiz = Quiz(
                title=title,
                description=q_data["description"],
                category_id=category.id,
                difficulty=q_data["difficulty"],
                duration=q_data["duration"],
                passing_score=q_data["passing_score"],
                max_attempts=q_data["max_attempts"],
                status=STATUS_DRAFT,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.session.add(quiz)
            db.session.flush()
        quiz_map[title] = quiz
    db.session.commit()
    return quiz_map


def seed_questions(quiz_map):
    total_q_added = 0
    total_opt_added = 0

    for quiz_title, questions_list in SEED_QUESTIONS.items():
        quiz = quiz_map[quiz_title]

        for q_info in questions_list:
            q_text = q_info["text"].strip()
            # Idempotent check: Question text in quiz
            existing_q = Question.query.filter_by(quiz_id=quiz.id, question_text=q_text).first()
            if not existing_q:
                question = Question(
                    quiz_id=quiz.id,
                    question_text=q_text,
                    question_type="MCQ",
                    marks=1,
                    explanation=q_info.get("explanation"),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.session.add(question)
                db.session.flush()
                total_q_added += 1

                for opt_info in q_info["options"]:
                    option = QuestionOption(
                        question_id=question.id,
                        option_key=opt_info["key"],
                        option_text=opt_info["text"],
                        is_correct=opt_info["is_correct"],
                        created_at=datetime.utcnow(),
                    )
                    db.session.add(option)
                    total_opt_added += 1
            else:
                # If question exists, make sure options exist
                if len(existing_q.options) == 0:
                    for opt_info in q_info["options"]:
                        option = QuestionOption(
                            question_id=existing_q.id,
                            option_key=opt_info["key"],
                            option_text=opt_info["text"],
                            is_correct=opt_info["is_correct"],
                            created_at=datetime.utcnow(),
                        )
                        db.session.add(option)
                        total_opt_added += 1

    db.session.commit()
    print(f"Seed completed: Added/verified {len(SEED_CATEGORIES)} categories, {len(SEED_QUIZZES)} quizzes, {total_q_added} new questions.")


def seed_all():
    db.create_all()
    cat_map = seed_categories()
    quiz_map = seed_quizzes(cat_map)
    seed_questions(quiz_map)


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_all()
