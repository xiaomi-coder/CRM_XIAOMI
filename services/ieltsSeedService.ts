import { db } from './supabase';

/**
 * Markaz uchun IELTS savollar mavjudligini tekshiradi.
 * Agar savollar yo'q bo'lsa, avtomatik namuna savollar qo'shadi.
 * Har bir markaz o'z centerId bilan alohida savollar oladi.
 */
export const seedIELTSQuestionsForCenter = async (centerId: string): Promise<boolean> => {
    try {
        // Tekshirish — bu markaz uchun savollar bormi?
        const existing = await db.get('ielts_reading_questions');
        const hasQuestions = (existing as any[]).some((q: any) => q.centerId === centerId);

        if (hasQuestions) {
            return false; // Savollar allaqachon bor
        }

        console.log('IELTS: Markaz uchun namuna savollar yaratilmoqda...', centerId);

        // ===================== READING =====================
        const readingQuestions = [
            // Passage 1: The History of Chocolate (1-13)
            ...generatePassage1Questions(centerId),
            // Passage 2: Renewable Energy (14-27)
            ...generatePassage2Questions(centerId),
            // Passage 3: Artificial Intelligence (28-40)
            ...generatePassage3Questions(centerId),
        ];

        // ===================== LISTENING =====================
        const listeningQuestions = [
            ...generateListeningSection1(centerId),
            ...generateListeningSection2(centerId),
            ...generateListeningSection3(centerId),
            ...generateListeningSection4(centerId),
        ];

        // ===================== WRITING =====================
        const writingTasks = [
            {
                id: crypto.randomUUID(),
                centerId,
                examType: 'academic',
                taskNumber: 1,
                taskPrompt: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
                wordLimitMin: 150,
                timeMinutes: 20,
            },
            {
                id: crypto.randomUUID(),
                centerId,
                examType: 'academic',
                taskNumber: 2,
                taskPrompt: 'Some people believe that universities should focus on providing academic skills and knowledge, while others think universities should also prepare students for their future careers.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.',
                wordLimitMin: 250,
                timeMinutes: 40,
            },
        ];

        // ===================== SPEAKING =====================
        const speakingQuestions = [
            // Part 1
            { id: crypto.randomUUID(), centerId, partNumber: 1, questionText: 'What is your full name?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 1, questionText: 'Where are you from?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 1, questionText: 'Do you work or study?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 1, questionText: 'What do you like to do in your free time?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 1, questionText: 'Do you prefer reading books or watching movies? Why?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            // Part 2
            {
                id: crypto.randomUUID(), centerId, partNumber: 2,
                questionText: 'Describe a place you have visited that you found very interesting.',
                cueCardTopic: 'An interesting place you visited',
                cueCardPoints: ['What the place is and where it is located', 'When you visited this place', 'What you did there', 'Why you found it interesting'],
                preparationTime: 60, speakingTime: 120,
            },
            // Part 3
            { id: crypto.randomUUID(), centerId, partNumber: 3, questionText: 'Why do people like to travel to new places?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 3, questionText: 'How has tourism changed in recent years?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 3, questionText: 'Do you think international travel is important for understanding other cultures?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 3, questionText: 'What are the negative effects of tourism on the environment?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
            { id: crypto.randomUUID(), centerId, partNumber: 3, questionText: 'How might travel change in the future?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        ];

        // ===================== INSERT ALL =====================
        const insertAll = async (table: string, items: any[]) => {
            for (const item of items) {
                await db.insert(table, item);
            }
        };

        await Promise.all([
            insertAll('ielts_reading_questions', readingQuestions),
            insertAll('ielts_listening_questions', listeningQuestions),
            insertAll('ielts_writing_tasks', writingTasks),
            insertAll('ielts_speaking_questions', speakingQuestions),
        ]);

        console.log('IELTS: Namuna savollar muvaffaqiyatli yaratildi!');
        return true;
    } catch (error) {
        console.error('IELTS seed error:', error);
        return false;
    }
};


// ========== READING PASSAGE 1 ==========
function generatePassage1Questions(centerId: string) {
    const passageTitle = 'The History of Chocolate';
    const passageText = `The history of chocolate begins in Mesoamerica. Fermented beverages made from chocolate date back to 1900 BC. The Aztecs believed that cacao seeds were the gift of Quetzalcoatl, the god of wisdom, and the seeds once had so much value that they were used as a form of currency. Originally prepared only as a drink, chocolate was served as a bitter liquid, mixed with spices or corn puree. It was believed to have aphrodisiac powers and to give the drinker strength.

After its arrival to Europe in the sixteenth century, sugar was added to it and it became popular throughout society, first among the ruling classes and then among the common people. In the 20th century, chocolate was considered essential in the rations of United States soldiers at war.

The word "chocolate" entered the English language from Spanish in about 1600. The origin of the Spanish word is nahuatl (the language of the Aztecs), "chocolatl", which referred to a drink made from cacao. The word derives from the Nahuatl word "xocolatl" meaning "bitter water".

Today, chocolate is used in a wide range of confectionery and food products. Global chocolate sales were valued at approximately $130 billion in 2019. The chocolate industry has been criticized for practices including child labor in cocoa production, particularly in West Africa. Fair trade certifications have been established to address these ethical concerns.

The production of chocolate involves harvesting cacao pods, fermenting and drying the cacao beans, roasting and grinding them, and then mixing the resulting cocoa liquor with other ingredients such as sugar and milk. Dark chocolate contains a higher percentage of cocoa solids and less sugar than milk chocolate. White chocolate, which contains cocoa butter but no cocoa solids, is technically not chocolate at all.

Research has suggested that dark chocolate may have health benefits due to its high content of flavonoids, which are antioxidants. Studies have shown potential benefits for cardiovascular health, brain function, and mood improvement. However, chocolate is also high in calories and sugar, so moderation is advised.`;

    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', passageNumber: 1,
        passageTitle, passageText: num === 1 ? passageText : '',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });

    return [
        q(1, 'true_false_not_given', 'The Aztecs used cacao seeds as money.', null, 'TRUE'),
        q(2, 'true_false_not_given', 'Chocolate was originally eaten as a solid food.', null, 'FALSE'),
        q(3, 'true_false_not_given', 'Sugar was added to chocolate after it arrived in Asia.', null, 'FALSE'),
        q(4, 'true_false_not_given', 'US soldiers received chocolate during wartime.', null, 'TRUE'),
        q(5, 'true_false_not_given', 'The word chocolate comes from an Arabic word.', null, 'FALSE'),
        q(6, 'multiple_choice', 'According to the passage, what did the Aztecs believe about cacao?',
            ['A) It was poisonous', 'B) It was a gift from a god', 'C) It could cure diseases', 'D) It was found by accident'], 'B'),
        q(7, 'multiple_choice', 'Global chocolate sales in 2019 were approximately:',
            ['A) $30 billion', 'B) $80 billion', 'C) $130 billion', 'D) $200 billion'], 'C'),
        q(8, 'sentence_completion', 'The Spanish word for chocolate originated from the _____ language.', null, 'nahuatl'),
        q(9, 'sentence_completion', 'The ethical concerns of the chocolate industry have led to _____ certifications.', null, 'fair trade'),
        q(10, 'sentence_completion', 'Dark chocolate may have health benefits due to its high content of _____.', null, 'flavonoids'),
        q(11, 'true_false_not_given', 'White chocolate contains cocoa solids.', null, 'FALSE'),
        q(12, 'true_false_not_given', 'Milk chocolate has more sugar than dark chocolate.', null, 'TRUE'),
        q(13, 'sentence_completion', 'The Nahuatl word "xocolatl" means _____.', null, 'bitter water'),
    ];
}

// ========== READING PASSAGE 2 ==========
function generatePassage2Questions(centerId: string) {
    const passageTitle = 'The Rise of Renewable Energy';
    const passageText = `The global energy landscape is undergoing a dramatic transformation. Renewable energy sources, including solar, wind, hydroelectric, and geothermal power, are rapidly displacing fossil fuels in many parts of the world. This shift is driven by a combination of environmental concerns, technological advances, and economic factors.

Solar energy has seen the most dramatic cost reduction of any energy technology in history. The cost of solar photovoltaic panels has fallen by more than 99% since 1976. Today, solar power is often the cheapest source of new electricity generation in many countries. China leads the world in solar energy capacity, followed by the United States, Japan, and Germany.

Wind energy has also experienced significant growth. Both onshore and offshore wind farms are being constructed at an increasing rate. Denmark generates approximately 50% of its electricity from wind power, making it the world leader in this regard. The United Kingdom has the largest offshore wind capacity in the world.

However, the intermittent nature of solar and wind energy presents challenges for grid stability. When the sun does not shine and the wind does not blow, alternative sources must fill the gap. Battery storage technology is advancing rapidly to address this issue. Lithium-ion batteries, similar to those used in electric vehicles, are increasingly being deployed at grid scale.

Hydroelectric power remains the largest source of renewable electricity globally, particularly in countries like Brazil, Canada, and Norway. However, large dam projects have been controversial due to their environmental and social impacts, including habitat destruction and displacement of communities.

Geothermal energy, which harnesses heat from the Earth's core, provides a consistent and reliable source of power. Iceland derives nearly 100% of its electricity from renewable sources, primarily geothermal and hydroelectric. The country has become a model for sustainable energy development.`;

    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', passageNumber: 2,
        passageTitle, passageText: num === 14 ? passageText : '',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });

    return [
        q(14, 'multiple_choice', 'What is the main topic of this passage?',
            ['A) The history of fossil fuels', 'B) The growth and challenges of renewable energy', 'C) Solar panel manufacturing', 'D) Climate change effects'], 'B'),
        q(15, 'true_false_not_given', 'Solar panel costs have decreased by more than 99% since 1976.', null, 'TRUE'),
        q(16, 'true_false_not_given', 'The United States leads the world in solar energy capacity.', null, 'FALSE'),
        q(17, 'sentence_completion', 'Denmark generates approximately _____ of its electricity from wind.', null, '50%'),
        q(18, 'multiple_choice', 'What technology is being developed to address the intermittent nature of renewable energy?',
            ['A) Nuclear reactors', 'B) Coal gasification', 'C) Battery storage', 'D) Natural gas turbines'], 'C'),
        q(19, 'true_false_not_given', 'Large hydroelectric dams have never caused environmental problems.', null, 'FALSE'),
        q(20, 'sentence_completion', 'Iceland derives nearly _____ of its electricity from renewable sources.', null, '100%'),
        q(21, 'true_false_not_given', 'The UK has the largest offshore wind capacity in the world.', null, 'TRUE'),
        q(22, 'multiple_choice', 'Which country leads the world in solar energy capacity?',
            ['A) United States', 'B) Germany', 'C) China', 'D) Japan'], 'C'),
        q(23, 'true_false_not_given', 'Geothermal energy is inconsistent and unreliable.', null, 'FALSE'),
        q(24, 'sentence_completion', 'Hydroelectric power remains the largest source of _____ electricity globally.', null, 'renewable'),
        q(25, 'true_false_not_given', 'Brazil is mentioned as a country with significant hydroelectric power.', null, 'TRUE'),
        q(26, 'multiple_choice', 'What type of batteries are being deployed at grid scale?',
            ['A) Lead-acid', 'B) Nickel-cadmium', 'C) Lithium-ion', 'D) Zinc-carbon'], 'C'),
        q(27, 'sentence_completion', 'Iceland has become a model for _____ energy development.', null, 'sustainable'),
    ];
}

// ========== READING PASSAGE 3 ==========
function generatePassage3Questions(centerId: string) {
    const passageTitle = 'Artificial Intelligence: Promises and Challenges';
    const passageText = `Artificial Intelligence (AI) has evolved from a theoretical concept in the 1950s to one of the most transformative technologies of the 21st century. The term was first coined by John McCarthy in 1956 at the Dartmouth Conference, where he proposed that "every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can be made to simulate it."

Modern AI systems can be broadly categorized into narrow AI and general AI. Narrow AI, also known as weak AI, is designed to perform specific tasks such as image recognition, language translation, or playing chess. These systems excel within their defined domains but cannot transfer their skills to other areas. General AI, or strong AI, refers to machines that possess the ability to understand, learn, and apply intelligence across a wide range of tasks, much like a human being. While general AI remains largely theoretical, narrow AI applications are already widespread.

The recent surge in AI capabilities has been largely driven by advances in machine learning, particularly deep learning. Deep learning uses neural networks with many layers to process vast amounts of data and identify patterns. The availability of large datasets and powerful computing resources has accelerated progress in this field.

AI applications span numerous industries. In healthcare, AI assists in diagnosing diseases, discovering drugs, and personalizing treatment plans. In finance, algorithms detect fraudulent transactions and manage investment portfolios. In transportation, self-driving vehicles represent one of the most ambitious AI applications.

However, the rapid advancement of AI also raises significant ethical and social concerns. Issues of algorithmic bias, job displacement, privacy, and autonomous weapons have sparked intense debate. Many experts advocate for responsible AI development, emphasizing the need for transparency, accountability, and human oversight.

The economic impact of AI is projected to be substantial. According to PricewaterhouseCoopers (PwC), AI could contribute up to $15.7 trillion to the global economy by 2030. This potential has led to an AI arms race among nations, with the United States, China, and the European Union investing heavily in AI research and development.`;

    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', passageNumber: 3,
        passageTitle, passageText: num === 28 ? passageText : '',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });

    return [
        q(28, 'multiple_choice', 'Who coined the term "Artificial Intelligence"?',
            ['A) Alan Turing', 'B) John McCarthy', 'C) Elon Musk', 'D) Tim Berners-Lee'], 'B'),
        q(29, 'true_false_not_given', 'The Dartmouth Conference was held in 1956.', null, 'TRUE'),
        q(30, 'multiple_choice', 'What is the difference between narrow AI and general AI?',
            ['A) Narrow AI is theoretical while general AI is practical', 'B) Narrow AI performs specific tasks while general AI can apply intelligence broadly', 'C) There is no difference', 'D) General AI is cheaper to develop'], 'B'),
        q(31, 'sentence_completion', 'Deep learning uses neural networks with many _____ to process data.', null, 'layers'),
        q(32, 'true_false_not_given', 'General AI is already widely available for commercial use.', null, 'FALSE'),
        q(33, 'multiple_choice', 'In which industry does AI help with diagnosing diseases?',
            ['A) Finance', 'B) Transportation', 'C) Healthcare', 'D) Education'], 'C'),
        q(34, 'true_false_not_given', 'Self-driving vehicles are an application of AI in transportation.', null, 'TRUE'),
        q(35, 'sentence_completion', 'According to PwC, AI could contribute up to $_____ trillion to the global economy by 2030.', null, '15.7'),
        q(36, 'true_false_not_given', 'Algorithmic bias is not a concern in AI development.', null, 'FALSE'),
        q(37, 'multiple_choice', 'What has driven the recent surge in AI capabilities?',
            ['A) Government regulations', 'B) Advances in machine learning and deep learning', 'C) Social media', 'D) Space exploration'], 'B'),
        q(38, 'sentence_completion', 'Many experts advocate for _____ AI development.', null, 'responsible'),
        q(39, 'true_false_not_given', 'Only the United States is investing in AI research.', null, 'FALSE'),
        q(40, 'multiple_choice', 'Which of the following is NOT mentioned as an ethical concern of AI?',
            ['A) Algorithmic bias', 'B) Job displacement', 'C) Data storage costs', 'D) Autonomous weapons'], 'C'),
    ];
}

// ========== LISTENING SECTION 1 ==========
function generateListeningSection1(centerId: string) {
    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', sectionNumber: 1,
        sectionTitle: 'Hotel Reservation Conversation', audioUrl: 'placeholder',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });
    return [
        q(1, 'form_completion', 'Guest name: _____', null, 'Sarah Johnson'),
        q(2, 'form_completion', 'Check-in date: March _____', null, '15'),
        q(3, 'form_completion', 'Number of nights: _____', null, '3'),
        q(4, 'multiple_choice', 'What type of room does the guest want?',
            ['A) Single room', 'B) Double room', 'C) Suite', 'D) Twin room'], 'B'),
        q(5, 'form_completion', 'Total cost per night: $ _____', null, '120'),
        q(6, 'multiple_choice', 'Breakfast is:',
            ['A) Not included', 'B) Included free', 'C) Available for extra $15', 'D) Only for premium guests'], 'C'),
        q(7, 'form_completion', 'Guest phone number: 07865 _____', null, '432109'),
        q(8, 'form_completion', 'Email: sarah.johnson@_____', null, 'gmail.com'),
        q(9, 'multiple_choice', 'The hotel is located near:',
            ['A) The airport', 'B) The train station', 'C) The city center', 'D) The beach'], 'C'),
        q(10, 'form_completion', 'Payment method: _____ card', null, 'credit'),
    ];
}

// ========== LISTENING SECTION 2 ==========
function generateListeningSection2(centerId: string) {
    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', sectionNumber: 2,
        sectionTitle: 'University Campus Tour', audioUrl: 'placeholder',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });
    return [
        q(11, 'multiple_choice', 'The library is open until:',
            ['A) 8 PM', 'B) 9 PM', 'C) 10 PM', 'D) Midnight'], 'C'),
        q(12, 'multiple_choice', 'The sports center has:',
            ['A) Only a gym', 'B) A gym and pool', 'C) A gym, pool, and tennis courts', 'D) Only outdoor facilities'], 'C'),
        q(13, 'form_completion', 'The cafeteria serves _____ types of cuisine.', null, '5'),
        q(14, 'multiple_choice', 'Student ID cards can be collected from:',
            ['A) The library', 'B) The admin building', 'C) The student union', 'D) Online'], 'B'),
        q(15, 'form_completion', 'The campus has _____ computer labs.', null, '4'),
        q(16, 'multiple_choice', 'Parking permits cost:',
            ['A) $50 per semester', 'B) $100 per semester', 'C) $200 per year', 'D) Free for students'], 'C'),
        q(17, 'form_completion', 'The medical center is in Building _____.', null, 'B'),
        q(18, 'multiple_choice', 'The bookshop offers a discount of:',
            ['A) 5%', 'B) 10%', 'C) 15%', 'D) 20%'], 'B'),
        q(19, 'form_completion', 'Campus Wi-Fi password: _____', null, 'student2024'),
        q(20, 'multiple_choice', 'The next orientation session is on:',
            ['A) Monday', 'B) Wednesday', 'C) Friday', 'D) Saturday'], 'B'),
    ];
}

// ========== LISTENING SECTION 3 ==========
function generateListeningSection3(centerId: string) {
    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', sectionNumber: 3,
        sectionTitle: 'Research Project Discussion', audioUrl: 'placeholder',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });
    return [
        q(21, 'multiple_choice', 'The research project is about:',
            ['A) Climate change', 'B) Ocean pollution', 'C) Urban development', 'D) Wildlife conservation'], 'B'),
        q(22, 'form_completion', 'The deadline for the first draft is _____ November.', null, '20'),
        q(23, 'multiple_choice', 'How many sources must be cited?',
            ['A) At least 5', 'B) At least 10', 'C) At least 15', 'D) At least 20'], 'C'),
        q(24, 'form_completion', 'The word count should be between 3000 and _____.', null, '5000'),
        q(25, 'multiple_choice', 'The preferred methodology is:',
            ['A) Qualitative only', 'B) Quantitative only', 'C) Mixed methods', 'D) Case study'], 'C'),
        q(26, 'form_completion', 'The survey should target _____ participants.', null, '200'),
        q(27, 'multiple_choice', 'The data analysis will use:',
            ['A) SPSS', 'B) Excel', 'C) Python', 'D) R'], 'A'),
        q(28, 'form_completion', 'The presentation is worth _____% of the total grade.', null, '20'),
        q(29, 'multiple_choice', 'Ethics approval must come from:',
            ['A) The department head', 'B) The ethics committee', 'C) The supervisor', 'D) Any faculty member'], 'B'),
        q(30, 'form_completion', 'The group meeting is every _____ at 2 PM.', null, 'Thursday'),
    ];
}

// ========== LISTENING SECTION 4 ==========
function generateListeningSection4(centerId: string) {
    const q = (num: number, type: string, text: string, options: string[] | null, answer: string) => ({
        id: crypto.randomUUID(), centerId, examType: 'academic', sectionNumber: 4,
        sectionTitle: 'Lecture: Marine Biology and Coral Reefs', audioUrl: 'placeholder',
        questionNumber: num, questionType: type, questionText: text,
        options, correctAnswer: answer, points: 1,
    });
    return [
        q(31, 'multiple_choice', 'Coral reefs cover approximately what percentage of ocean floor?',
            ['A) Less than 1%', 'B) About 5%', 'C) About 10%', 'D) About 25%'], 'A'),
        q(32, 'sentence_completion', 'Coral reefs support approximately _____ of all marine species.', null, '25%'),
        q(33, 'multiple_choice', 'The Great Barrier Reef is located in:',
            ['A) The Caribbean', 'B) The Indian Ocean', 'C) Australia', 'D) Southeast Asia'], 'C'),
        q(34, 'sentence_completion', 'Coral bleaching is primarily caused by rising water _____.', null, 'temperatures'),
        q(35, 'multiple_choice', 'Coral reefs are sometimes called the _____ of the sea.',
            ['A) Forests', 'B) Deserts', 'C) Rainforests', 'D) Mountains'], 'C'),
        q(36, 'sentence_completion', 'The symbiotic algae living in coral are called _____.', null, 'zooxanthellae'),
        q(37, 'multiple_choice', 'Ocean acidification is caused by:',
            ['A) Volcanic activity', 'B) CO2 absorption', 'C) Oil spills', 'D) Overfishing'], 'B'),
        q(38, 'sentence_completion', 'Healthy coral reefs protect coastlines from _____ damage.', null, 'storm'),
        q(39, 'multiple_choice', 'Coral reef restoration involves:',
            ['A) Only planting new coral', 'B) Reducing pollution and planting coral', 'C) Building artificial reefs only', 'D) Draining sea water'], 'B'),
        q(40, 'sentence_completion', 'The lecture concludes that coral reefs could disappear by _____ if no action is taken.', null, '2050'),
    ];
}
