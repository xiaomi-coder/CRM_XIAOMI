-- ==========================================
-- IELTS Sample Data
-- MUHIM: 'YOUR_CENTER_ID' ni o'z markaz ID ga almashtiring!
-- ==========================================

-- Markaz ID ni belgilang (Supabase settings jadvalidan oling)
-- Masalan: DO $$ DECLARE center_id UUID := 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; BEGIN ... END $$;

-- ==========================================
-- READING — Passage 1: The History of Chocolate
-- ==========================================

INSERT INTO ielts_reading_questions ("centerId", "examType", "passageNumber", "passageTitle", "passageText", "questionNumber", "questionType", "questionText", options, "correctAnswer") VALUES

-- Passage 1 (13 savol)
('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate',
'The history of chocolate begins in Mesoamerica. Fermented beverages made from chocolate date back to 1900 BC. The Aztecs believed that cacao seeds were the gift of Quetzalcoatl, the god of wisdom, and the seeds once had so much value that they were used as a form of currency. Originally prepared only as a drink, chocolate was served as a bitter liquid, mixed with spices or corn puree. It was believed to have aphrodisiac powers and to give the drinker strength.

After its arrival to Europe in the sixteenth century, sugar was added to it and it became popular throughout society, first among the ruling classes and then among the common people. In the 20th century, chocolate was considered essential in the rations of United States soldiers at war.

The word "chocolate" entered the English language from Spanish in about 1600. The origin of the Spanish word is nahuatl (the language of the Aztecs), "chocolatl", which referred to a drink made from cacao. The word derives from the Nahuatl word "xocolatl" meaning "bitter water".

Today, chocolate is used in a wide range of confectionery and food products. Global chocolate sales were valued at approximately $130 billion in 2019. The chocolate industry has been criticized for practices including child labor in cocoa production, particularly in West Africa. Fair trade certifications have been established to address these ethical concerns.

The production of chocolate involves harvesting cacao pods, fermenting and drying the cacao beans, roasting and grinding them, and then mixing the resulting cocoa liquor with other ingredients such as sugar and milk. Dark chocolate contains a higher percentage of cocoa solids and less sugar than milk chocolate. White chocolate, which contains cocoa butter but no cocoa solids, is technically not chocolate at all.

Research has suggested that dark chocolate may have health benefits due to its high content of flavonoids, which are antioxidants. Studies have shown potential benefits for cardiovascular health, brain function, and mood improvement. However, chocolate is also high in calories and sugar, so moderation is advised.',
1, 'true_false_not_given', 'The Aztecs used cacao seeds as money.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 2, 'true_false_not_given', 'Chocolate was originally eaten as a solid food.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 3, 'true_false_not_given', 'Sugar was added to chocolate after it arrived in Asia.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 4, 'true_false_not_given', 'US soldiers received chocolate during wartime.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 5, 'true_false_not_given', 'The word chocolate comes from an Arabic word.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 6, 'multiple_choice', 'According to the passage, what did the Aztecs believe about cacao?',
'["A) It was poisonous", "B) It was a gift from a god", "C) It could cure diseases", "D) It was found by accident"]', 'B'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 7, 'multiple_choice', 'Global chocolate sales in 2019 were approximately:',
'["A) $30 billion", "B) $80 billion", "C) $130 billion", "D) $200 billion"]', 'C'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 8, 'sentence_completion', 'The Spanish word for chocolate originated from the _____ language.', NULL, 'nahuatl'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 9, 'sentence_completion', 'The ethical concerns of the chocolate industry have led to _____ certifications.', NULL, 'fair trade'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 10, 'sentence_completion', 'Dark chocolate may have health benefits due to its high content of _____.', NULL, 'flavonoids'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 11, 'true_false_not_given', 'White chocolate contains cocoa solids.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 12, 'true_false_not_given', 'Milk chocolate has more sugar than dark chocolate.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 1, 'The History of Chocolate', '', 13, 'sentence_completion', 'The Nahuatl word "xocolatl" means _____.', NULL, 'bitter water'),

-- ==========================================
-- READING — Passage 2: Renewable Energy
-- ==========================================

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy',
'The global energy landscape is undergoing a dramatic transformation. Renewable energy sources, including solar, wind, hydroelectric, and geothermal power, are rapidly displacing fossil fuels in many parts of the world. This shift is driven by a combination of environmental concerns, technological advances, and economic factors.

Solar energy has seen the most dramatic cost reduction of any energy technology in history. The cost of solar photovoltaic panels has fallen by more than 99% since 1976. Today, solar power is often the cheapest source of new electricity generation in many countries. China leads the world in solar energy capacity, followed by the United States, Japan, and Germany.

Wind energy has also experienced significant growth. Both onshore and offshore wind farms are being constructed at an increasing rate. Denmark generates approximately 50% of its electricity from wind power, making it the world leader in this regard. The United Kingdom has the largest offshore wind capacity in the world.

However, the intermittent nature of solar and wind energy presents challenges for grid stability. When the sun does not shine and the wind does not blow, alternative sources must fill the gap. Battery storage technology is advancing rapidly to address this issue. Lithium-ion batteries, similar to those used in electric vehicles, are increasingly being deployed at grid scale.

Hydroelectric power remains the largest source of renewable electricity globally, particularly in countries like Brazil, Canada, and Norway. However, large dam projects have been controversial due to their environmental and social impacts, including habitat destruction and displacement of communities.

Geothermal energy, which harnesses heat from the Earth''s core, provides a consistent and reliable source of power. Iceland derives nearly 100% of its electricity from renewable sources, primarily geothermal and hydroelectric. The country has become a model for sustainable energy development.',
14, 'multiple_choice', 'What is the main topic of this passage?',
'["A) The history of fossil fuels", "B) The growth and challenges of renewable energy", "C) Solar panel manufacturing", "D) Climate change effects"]', 'B'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 15, 'true_false_not_given', 'Solar panel costs have decreased by more than 99% since 1976.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 16, 'true_false_not_given', 'The United States leads the world in solar energy capacity.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 17, 'sentence_completion', 'Denmark generates approximately _____ of its electricity from wind.', NULL, '50%'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 18, 'multiple_choice', 'What technology is being developed to address the intermittent nature of renewable energy?',
'["A) Nuclear reactors", "B) Coal gasification", "C) Battery storage", "D) Natural gas turbines"]', 'C'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 19, 'true_false_not_given', 'Large hydroelectric dams have never caused environmental problems.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 20, 'sentence_completion', 'Iceland derives nearly _____ of its electricity from renewable sources.', NULL, '100%'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 21, 'true_false_not_given', 'The UK has the largest offshore wind capacity in the world.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 22, 'multiple_choice', 'Which country leads the world in solar energy capacity?',
'["A) United States", "B) Germany", "C) China", "D) Japan"]', 'C'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 23, 'true_false_not_given', 'Geothermal energy is inconsistent and unreliable.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 24, 'sentence_completion', 'Hydroelectric power remains the largest source of _____ electricity globally.', NULL, 'renewable'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 25, 'true_false_not_given', 'Brazil is mentioned as a country with significant hydroelectric power.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 26, 'multiple_choice', 'What type of batteries are being deployed at grid scale?',
'["A) Lead-acid", "B) Nickel-cadmium", "C) Lithium-ion", "D) Zinc-carbon"]', 'C'),

('YOUR_CENTER_ID', 'academic', 2, 'The Rise of Renewable Energy', '', 27, 'sentence_completion', 'Iceland has become a model for _____ energy development.', NULL, 'sustainable'),

-- ==========================================
-- READING — Passage 3: Artificial Intelligence
-- ==========================================

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges',
'Artificial Intelligence (AI) has evolved from a theoretical concept in the 1950s to one of the most transformative technologies of the 21st century. The term was first coined by John McCarthy in 1956 at the Dartmouth Conference, where he proposed that "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."

Modern AI systems can be broadly categorized into narrow AI and general AI. Narrow AI, also known as weak AI, is designed to perform specific tasks such as image recognition, language translation, or playing chess. These systems excel within their defined domains but cannot transfer their skills to other areas. General AI, or strong AI, refers to machines that possess the ability to understand, learn, and apply intelligence across a wide range of tasks, much like a human being. While general AI remains largely theoretical, narrow AI applications are already widespread.

The recent surge in AI capabilities has been largely driven by advances in machine learning, particularly deep learning. Deep learning uses neural networks with many layers to process vast amounts of data and identify patterns. The availability of large datasets and powerful computing resources has accelerated progress in this field.

AI applications span numerous industries. In healthcare, AI assists in diagnosing diseases, discovering drugs, and personalizing treatment plans. In finance, algorithms detect fraudulent transactions and manage investment portfolios. In transportation, self-driving vehicles represent one of the most ambitious AI applications.

However, the rapid advancement of AI also raises significant ethical and social concerns. Issues of algorithmic bias, job displacement, privacy, and autonomous weapons have sparked intense debate. Many experts advocate for responsible AI development, emphasizing the need for transparency, accountability, and human oversight.

The economic impact of AI is projected to be substantial. According to PricewaterhouseCoopers (PwC), AI could contribute up to $15.7 trillion to the global economy by 2030. This potential has led to an AI arms race among nations, with the United States, China, and the European Union investing heavily in AI research and development.',
28, 'multiple_choice', 'Who coined the term "Artificial Intelligence"?',
'["A) Alan Turing", "B) John McCarthy", "C) Elon Musk", "D) Tim Berners-Lee"]', 'B'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 29, 'true_false_not_given', 'The Dartmouth Conference was held in 1956.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 30, 'multiple_choice', 'What is the difference between narrow AI and general AI?',
'["A) Narrow AI is theoretical while general AI is practical", "B) Narrow AI performs specific tasks while general AI can apply intelligence broadly", "C) There is no difference", "D) General AI is cheaper to develop"]', 'B'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 31, 'sentence_completion', 'Deep learning uses neural networks with many _____ to process data.', NULL, 'layers'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 32, 'true_false_not_given', 'General AI is already widely available for commercial use.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 33, 'multiple_choice', 'In which industry does AI help with diagnosing diseases?',
'["A) Finance", "B) Transportation", "C) Healthcare", "D) Education"]', 'C'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 34, 'true_false_not_given', 'Self-driving vehicles are an application of AI in transportation.', NULL, 'TRUE'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 35, 'sentence_completion', 'According to PwC, AI could contribute up to $_____ trillion to the global economy by 2030.', NULL, '15.7'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 36, 'true_false_not_given', 'Algorithmic bias is not a concern in AI development.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 37, 'multiple_choice', 'What has driven the recent surge in AI capabilities?',
'["A) Government regulations", "B) Advances in machine learning and deep learning", "C) Social media", "D) Space exploration"]', 'B'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 38, 'sentence_completion', 'Many experts advocate for _____ AI development.', NULL, 'responsible'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 39, 'true_false_not_given', 'Only the United States is investing in AI research.', NULL, 'FALSE'),

('YOUR_CENTER_ID', 'academic', 3, 'Artificial Intelligence: Promises and Challenges', '', 40, 'multiple_choice', 'Which of the following is NOT mentioned as an ethical concern of AI?',
'["A) Algorithmic bias", "B) Job displacement", "C) Data storage costs", "D) Autonomous weapons"]', 'C');


-- ==========================================
-- LISTENING — Section 1-4 (40 savol)
-- ==========================================

INSERT INTO ielts_listening_questions ("centerId", "examType", "sectionNumber", "sectionTitle", "audioUrl", "questionNumber", "questionType", "questionText", options, "correctAnswer") VALUES

-- Section 1: Hotel Booking (10 savol)
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
1, 'form_completion', 'Guest name: _____', NULL, 'Sarah Johnson'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
2, 'form_completion', 'Check-in date: March _____', NULL, '15'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
3, 'form_completion', 'Number of nights: _____', NULL, '3'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
4, 'multiple_choice', 'What type of room does the guest want?',
'["A) Single room", "B) Double room", "C) Suite", "D) Twin room"]', 'B'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
5, 'form_completion', 'Total cost per night: $ _____', NULL, '120'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
6, 'multiple_choice', 'Breakfast is:',
'["A) Not included", "B) Included free", "C) Available for extra $15", "D) Only for premium guests"]', 'C'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
7, 'form_completion', 'Guest phone number: 07865 _____', NULL, '432109'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
8, 'form_completion', 'Email: sarah.johnson@_____', NULL, 'gmail.com'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
9, 'multiple_choice', 'The hotel is located near:',
'["A) The airport", "B) The train station", "C) The city center", "D) The beach"]', 'C'),
('YOUR_CENTER_ID', 'academic', 1, 'Hotel Reservation Conversation', 'placeholder',
10, 'form_completion', 'Payment method: _____ card', NULL, 'credit'),

-- Section 2: Campus Tour (10 savol)
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
11, 'multiple_choice', 'The library is open until:',
'["A) 8 PM", "B) 9 PM", "C) 10 PM", "D) Midnight"]', 'C'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
12, 'multiple_choice', 'The sports center has:',
'["A) Only a gym", "B) A gym and pool", "C) A gym, pool, and tennis courts", "D) Only outdoor facilities"]', 'C'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
13, 'form_completion', 'The cafeteria serves _____ types of cuisine.', NULL, '5'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
14, 'multiple_choice', 'Student ID cards can be collected from:',
'["A) The library", "B) The admin building", "C) The student union", "D) Online"]', 'B'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
15, 'form_completion', 'The campus has _____ computer labs.', NULL, '4'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
16, 'multiple_choice', 'Parking permits cost:',
'["A) $50 per semester", "B) $100 per semester", "C) $200 per year", "D) Free for students"]', 'C'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
17, 'form_completion', 'The medical center is in Building _____.', NULL, 'B'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
18, 'multiple_choice', 'The bookshop offers a discount of:',
'["A) 5%", "B) 10%", "C) 15%", "D) 20%"]', 'B'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
19, 'form_completion', 'Campus Wi-Fi password: _____', NULL, 'student2024'),
('YOUR_CENTER_ID', 'academic', 2, 'University Campus Tour', 'placeholder',
20, 'multiple_choice', 'The next orientation session is on:',
'["A) Monday", "B) Wednesday", "C) Friday", "D) Saturday"]', 'B'),

-- Section 3: Research Discussion (10 savol)
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
21, 'multiple_choice', 'The research project is about:',
'["A) Climate change", "B) Ocean pollution", "C) Urban development", "D) Wildlife conservation"]', 'B'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
22, 'form_completion', 'The deadline for the first draft is _____ November.', NULL, '20'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
23, 'multiple_choice', 'How many sources must be cited?',
'["A) At least 5", "B) At least 10", "C) At least 15", "D) At least 20"]', 'C'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
24, 'form_completion', 'The word count should be between 3000 and _____.', NULL, '5000'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
25, 'multiple_choice', 'The preferred methodology is:',
'["A) Qualitative only", "B) Quantitative only", "C) Mixed methods", "D) Case study"]', 'C'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
26, 'form_completion', 'The survey should target _____ participants.', NULL, '200'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
27, 'multiple_choice', 'The data analysis will use:',
'["A) SPSS", "B) Excel", "C) Python", "D) R"]', 'A'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
28, 'form_completion', 'The presentation is worth _____% of the total grade.', NULL, '20'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
29, 'multiple_choice', 'Ethics approval must come from:',
'["A) The department head", "B) The ethics committee", "C) The supervisor", "D) Any faculty member"]', 'B'),
('YOUR_CENTER_ID', 'academic', 3, 'Research Project Discussion', 'placeholder',
30, 'form_completion', 'The group meeting is every _____ at 2 PM.', NULL, 'Thursday'),

-- Section 4: Lecture (10 savol)
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
31, 'multiple_choice', 'Coral reefs cover approximately what percentage of ocean floor?',
'["A) Less than 1%", "B) About 5%", "C) About 10%", "D) About 25%"]', 'A'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
32, 'sentence_completion', 'Coral reefs support approximately _____ of all marine species.', NULL, '25%'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
33, 'multiple_choice', 'The Great Barrier Reef is located in:',
'["A) The Caribbean", "B) The Indian Ocean", "C) Australia", "D) Southeast Asia"]', 'C'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
34, 'sentence_completion', 'Coral bleaching is primarily caused by rising water _____.', NULL, 'temperatures'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
35, 'multiple_choice', 'Coral reefs are sometimes called the _____ of the sea.',
'["A) Forests", "B) Deserts", "C) Rainforests", "D) Mountains"]', 'C'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
36, 'sentence_completion', 'The symbiotic algae living in coral are called _____.', NULL, 'zooxanthellae'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
37, 'multiple_choice', 'Ocean acidification is caused by:',
'["A) Volcanic activity", "B) CO2 absorption", "C) Oil spills", "D) Overfishing"]', 'B'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
38, 'sentence_completion', 'Healthy coral reefs protect coastlines from _____ damage.', NULL, 'storm'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
39, 'multiple_choice', 'Coral reef restoration involves:',
'["A) Only planting new coral", "B) Reducing pollution and planting coral", "C) Building artificial reefs only", "D) Draining sea water"]', 'B'),
('YOUR_CENTER_ID', 'academic', 4, 'Lecture: Marine Biology and Coral Reefs', 'placeholder',
40, 'sentence_completion', 'The lecture concludes that coral reefs could disappear by _____ if no action is taken.', NULL, '2050');


-- ==========================================
-- WRITING TASKS
-- ==========================================

INSERT INTO ielts_writing_tasks ("centerId", "examType", "taskNumber", "taskPrompt", "wordLimitMin", "timeMinutes") VALUES

('YOUR_CENTER_ID', 'academic', 1,
'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.',
150, 20),

('YOUR_CENTER_ID', 'academic', 2,
'Some people believe that universities should focus on providing academic skills and knowledge, while others think universities should also prepare students for their future careers.

Discuss both views and give your own opinion.

Write at least 250 words.',
250, 40);


-- ==========================================
-- SPEAKING QUESTIONS
-- ==========================================

INSERT INTO ielts_speaking_questions ("centerId", "partNumber", "questionText", "cueCardTopic", "cueCardPoints", "preparationTime", "speakingTime") VALUES

-- Part 1 (5 savol)
('YOUR_CENTER_ID', 1, 'What is your full name?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 1, 'Where are you from?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 1, 'Do you work or study?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 1, 'What do you like to do in your free time?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 1, 'Do you prefer reading books or watching movies? Why?', NULL, NULL, NULL, NULL),

-- Part 2 (1 cue card)
('YOUR_CENTER_ID', 2,
'Describe a place you have visited that you found very interesting.',
'An interesting place you visited',
'["What the place is and where it is located", "When you visited this place", "What you did there", "Why you found it interesting"]',
60, 120),

-- Part 3 (5 savol)
('YOUR_CENTER_ID', 3, 'Why do people like to travel to new places?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 3, 'How has tourism changed in recent years?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 3, 'Do you think international travel is important for understanding other cultures?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 3, 'What are the negative effects of tourism on the environment?', NULL, NULL, NULL, NULL),
('YOUR_CENTER_ID', 3, 'How might travel change in the future?', NULL, NULL, NULL, NULL);
