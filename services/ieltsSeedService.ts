import { db } from './supabase';

// Platforma testlari uchun global ID (barcha markazlar uchun umumiy)
export const PLATFORM_CENTER_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Platforma Test 2: "Technology & Society" mavzusi
 * Bu test barcha markazlarga umumiy — super admin tomonidan bir marta qo'shiladi.
 * centerId = PLATFORM_CENTER_ID bo'ladi.
 */
export const seedPlatformTest2 = async (): Promise<{ success: boolean; testId?: string; error?: string }> => {
    try {
        // Tekshirish — Test 2 allaqachon bormi?
        const existing = await db.get('ielts_tests');
        const alreadyExists = (existing as any[]).some(
            (t: any) => (t.center_id === PLATFORM_CENTER_ID || t.centerId === PLATFORM_CENTER_ID) && t.title === 'Platform Test 2 – Technology & Society'
        );
        if (alreadyExists) {
            return { success: false, error: 'Platform Test 2 allaqachon mavjud!' };
        }

        const testId = crypto.randomUUID();

        // 1. ielts_tests jadvaliga test yaratish
        await db.insert('ielts_tests', {
            id: testId,
            center_id: PLATFORM_CENTER_ID,
            title: 'Platform Test 2 – Technology & Society',
            exam_type: 'academic',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });

        const insertAll = async (table: string, items: any[]) => {
            for (const item of items) await db.insert(table, item);
        };

        await Promise.all([
            insertAll('ielts_reading_questions', generatePT2Reading(PLATFORM_CENTER_ID, testId)),
            insertAll('ielts_listening_questions', generatePT2Listening(PLATFORM_CENTER_ID, testId)),
            insertAll('ielts_writing_tasks', generatePT2Writing(PLATFORM_CENTER_ID, testId)),
            insertAll('ielts_speaking_questions', generatePT2Speaking(PLATFORM_CENTER_ID, testId)),
        ]);

        console.log('Platform Test 2 muvaffaqiyatli yaratildi! testId:', testId);
        return { success: true, testId };
    } catch (error: any) {
        console.error('Platform Test 2 seed error:', error);
        return { success: false, error: error.message };
    }
};

// ---- PLATFORM TEST 2: READING ----
function generatePT2Reading(centerId: string, testId: string) {
    const q = (num: number, pNum: number, pTitle: string, pText: string, type: string, text: string, opts: string[] | null, ans: string) => ({
        id: crypto.randomUUID(), centerId, test_id: testId, examType: 'academic',
        passageNumber: pNum, passageTitle: pTitle,
        passageText: num === (pNum === 1 ? 1 : pNum === 2 ? 14 : 28) ? pText : '',
        questionNumber: num, questionType: type, questionText: text,
        options: opts, correctAnswer: ans, points: 1,
    });

    const p1Text = `The Digital Revolution and Human Behaviour

The rapid advancement of digital technology over the past two decades has fundamentally altered the way humans communicate, work, and socialise. Smartphones, once considered luxury items, are now owned by more than 6.8 billion people worldwide – representing 85% of the global population. This unprecedented connectivity has brought both remarkable benefits and serious challenges to modern society.

Research conducted by the American Psychological Association found that 45% of adults report feeling overwhelmed by the constant connectivity demanded by modern devices. Psychologists have coined the term "technostress" to describe the anxiety and cognitive strain experienced by individuals who feel unable to cope with the demands of digital life. Despite these concerns, the same study found that 72% of participants believed that technology had an overall positive effect on their lives.

The impact of social media platforms on social behaviour has been particularly significant. Studies suggest that teenagers in developed countries spend an average of seven hours per day on screens – more time than they spend sleeping. While this has raised concerns among educators and parents about declining attention spans and reduced face-to-face interaction, researchers at Oxford University have found that moderate social media use can actually strengthen existing social bonds and facilitate the formation of new ones.

Digital technology has also transformed the workplace. Remote work, once a privilege reserved for a small minority, became a necessity for hundreds of millions during the global pandemic. A survey by McKinsey found that 87% of employees offered remote work opportunities take advantage of them. However, the boundaries between work and personal life have become increasingly blurred, with many workers reporting difficulty "switching off" from professional responsibilities.

The question of digital inequality has emerged as a major concern. While access to the internet has expanded dramatically, a significant "digital divide" persists between developed and developing nations, as well as between urban and rural communities within the same country. Approximately 2.6 billion people remain without internet access, limiting their participation in the modern economy and access to educational resources.`;

    const p2Text = `Artificial Intelligence in Healthcare

Artificial intelligence is rapidly transforming the healthcare industry, offering the potential to revolutionise diagnosis, treatment, and patient care. Machine learning algorithms can now analyse medical images with accuracy that rivals – and in some cases exceeds – that of experienced human physicians. A study published in Nature Medicine demonstrated that an AI system detected breast cancer from mammograms with greater accuracy than a panel of radiologists, reducing false positives by 5.7% and false negatives by 9.4%.

Beyond diagnostics, AI is being employed to accelerate drug discovery. Traditional pharmaceutical development is an enormously costly and time-consuming process, often requiring over a decade and billions of dollars to bring a single drug to market. AI-powered platforms can analyse vast molecular databases to identify promising drug candidates in a fraction of the time. During the COVID-19 pandemic, AI tools helped researchers identify potential vaccine components at unprecedented speed.

Predictive analytics powered by AI is enabling healthcare providers to identify at-risk patients before they develop serious conditions. By analysing patterns in electronic health records, AI systems can flag patients who may be at risk of sepsis, heart failure, or diabetic complications, allowing clinicians to intervene proactively. One hospital system in the United States reported a 20% reduction in sepsis mortality after implementing an AI-driven early warning system.

Despite these promising developments, significant challenges remain. Questions of data privacy and security are paramount, as AI systems require access to vast quantities of sensitive patient information. There are also concerns about algorithmic bias, as AI systems trained predominantly on data from certain demographic groups may perform less accurately for others. A 2019 study found that a widely used healthcare algorithm exhibited significant racial bias, underestimating the medical needs of Black patients.

The regulatory landscape for AI in healthcare is still evolving. Health authorities around the world are working to develop frameworks that balance the need to protect patients with the desire to foster innovation. Critics argue that overly restrictive regulation could slow the development of life-saving technologies, while patient advocates warn that insufficient oversight poses unacceptable risks.`;

    const p3Text = `Urban Planning and the Sustainable City

As the global population becomes increasingly urban – with projections suggesting that 68% of people will live in cities by 2050 – urban planners face the enormous challenge of creating cities that are both liveable and sustainable. Traditional urban development models, which prioritised motor vehicle transport and suburban sprawl, are being reconsidered in light of pressing environmental and social challenges.

The concept of the "15-minute city," popularised by Paris Mayor Anne Hidalgo and urban theorist Carlos Moreno, proposes that residents should be able to access all essential services – work, education, healthcare, shopping, and leisure – within a 15-minute walk or cycle from their homes. This model, which has gained significant traction in cities including Paris, Melbourne, and Portland, aims to reduce car dependency, decrease carbon emissions, and foster stronger community bonds.

Mixed-use zoning, which allows residential, commercial, and recreational spaces to coexist in close proximity, is a key tool in implementing this vision. Cities that have embraced mixed-use development report lower rates of car ownership, increased pedestrian activity, and higher levels of reported wellbeing among residents. However, critics argue that mixed-use developments can drive gentrification, displacing lower-income residents as property values rise.

Green infrastructure is another cornerstone of sustainable urban planning. Urban forests, green roofs, parks, and constructed wetlands help to regulate urban temperatures, manage stormwater, improve air quality, and support biodiversity. Singapore, often cited as a model of sustainable urban development, has committed to ensuring that 80% of buildings are green-certified by 2030.

The role of data and technology in shaping the cities of the future cannot be overstated. Smart city technologies, including sensor networks, real-time data analytics, and connected infrastructure, enable city managers to optimise traffic flow, energy consumption, and waste management. Barcelona's superblock model, which restricts vehicle access to create pedestrian-friendly urban "rooms," has been shown to reduce air pollution by up to 40% within superblock areas.`;

    return [
        // Passage 1 (Q1-13)
        q(1,1,'The Digital Revolution and Human Behaviour',p1Text,'true_false_not_given','Smartphones are owned by more than half the world\'s population.',null,'TRUE'),
        q(2,1,'','','true_false_not_given','The term "technostress" was invented by a government agency.',null,'FALSE'),
        q(3,1,'','','true_false_not_given','Most people surveyed believed technology had a net positive effect on their lives.',null,'TRUE'),
        q(4,1,'','','true_false_not_given','Oxford University researchers concluded that social media always harms teenagers.',null,'FALSE'),
        q(5,1,'','','multiple_choice','According to the passage, how many people lack internet access?',['A) 1.6 billion','B) 2.6 billion','C) 3.6 billion','D) 4.6 billion'],'B'),
        q(6,1,'','','multiple_choice','What did McKinsey\'s survey find about remote work?',['A) Most workers dislike it','B) 87% of those offered it take advantage','C) It reduces productivity','D) It is only for managers'],'B'),
        q(7,1,'','','sentence_completion','Researchers describe the anxiety caused by digital overload as _____.',null,'technostress'),
        q(8,1,'','','sentence_completion','Teenagers in developed countries spend an average of _____ hours per day on screens.',null,'seven'),
        q(9,1,'','','sentence_completion','The digital divide refers to the gap between those with and without access to _____.',null,'the internet'),
        q(10,1,'','','true_false_not_given','Remote work became widespread during the global pandemic.',null,'TRUE'),
        q(11,1,'','','true_false_not_given','All workers find it easy to separate their professional and personal lives when working remotely.',null,'FALSE'),
        q(12,1,'','','true_false_not_given','Digital technology has not changed the nature of social interaction.',null,'FALSE'),
        q(13,1,'','','multiple_choice','The passage suggests that the overall view of technology among adults is:',['A) Entirely negative','B) Entirely positive','C) Mixed — both positive and negative','D) Indifferent'],'C'),

        // Passage 2 (Q14-26)
        q(14,2,'Artificial Intelligence in Healthcare',p2Text,'true_false_not_given','The AI system described reduced both false positives and false negatives in cancer detection.',null,'TRUE'),
        q(15,2,'','','true_false_not_given','Developing a new drug traditionally takes less than five years.',null,'FALSE'),
        q(16,2,'','','multiple_choice','What did one US hospital report after implementing an AI early warning system?',['A) 10% reduction in costs','B) 20% reduction in sepsis mortality','C) 30% increase in patient satisfaction','D) 40% reduction in wait times'],'B'),
        q(17,2,'','','true_false_not_given','AI systems trained on limited demographic data may work less accurately for some groups.',null,'TRUE'),
        q(18,2,'','','true_false_not_given','The regulatory frameworks for AI in healthcare are fully established globally.',null,'FALSE'),
        q(19,2,'','','sentence_completion','AI systems can identify at-risk patients by analysing patterns in _____.',null,'electronic health records'),
        q(20,2,'','','sentence_completion','A 2019 study found that a healthcare algorithm underestimated the medical needs of _____ patients.',null,'Black'),
        q(21,2,'','','sentence_completion','During COVID-19, AI helped identify potential _____ components quickly.',null,'vaccine'),
        q(22,2,'','','multiple_choice','What is described as a major challenge for AI in healthcare?',['A) Lack of computing power','B) Data privacy and security','C) Shortage of doctors','D) High cost of AI tools'],'B'),
        q(23,2,'','','true_false_not_given','AI drug discovery platforms are slower than traditional methods.',null,'FALSE'),
        q(24,2,'','','true_false_not_given','The passage suggests that all health authorities agree on the right approach to AI regulation.',null,'NOT GIVEN'),
        q(25,2,'','','multiple_choice','The Nature Medicine study compared AI performance to:',['A) Junior medical students','B) A panel of radiologists','C) Government health agencies','D) Pharmaceutical companies'],'B'),
        q(26,2,'','','sentence_completion','Critics argue that overly restrictive regulation could slow the development of _____ technologies.',null,'life-saving'),

        // Passage 3 (Q27-40)
        q(27,3,'Urban Planning and the Sustainable City',p3Text,'true_false_not_given','By 2050, more than two-thirds of the global population is projected to live in cities.',null,'TRUE'),
        q(28,3,'','','true_false_not_given','The 15-minute city concept was invented by an urban planner in Melbourne.',null,'FALSE'),
        q(29,3,'','','multiple_choice','What is the primary aim of the "15-minute city" model?',['A) To increase public transport use','B) To reduce car dependency and carbon emissions','C) To attract more businesses to city centres','D) To build more high-rise apartments'],'B'),
        q(30,3,'','','true_false_not_given','Mixed-use zoning has been linked to increased pedestrian activity.',null,'TRUE'),
        q(31,3,'','','true_false_not_given','Singapore has already achieved its green building certification target.',null,'FALSE'),
        q(32,3,'','','sentence_completion','Carlos Moreno is described in the passage as an urban _____.',null,'theorist'),
        q(33,3,'','','sentence_completion','Barcelona\'s superblock model has been shown to reduce air pollution by up to _____ within those areas.',null,'40%'),
        q(34,3,'','','sentence_completion','Singapore has committed to ensuring that _____ of buildings are green-certified by 2030.',null,'80%'),
        q(35,3,'','','multiple_choice','What concern do critics raise about mixed-use developments?',['A) They are too expensive to build','B) They can lead to gentrification','C) They reduce property values','D) They create traffic problems'],'B'),
        q(36,3,'','','true_false_not_given','Green infrastructure helps to regulate urban temperatures.',null,'TRUE'),
        q(37,3,'','','true_false_not_given','Smart city technologies are used to optimise traffic flow.',null,'TRUE'),
        q(38,3,'','','true_false_not_given','The 15-minute city model has been rejected by most major cities.',null,'FALSE'),
        q(39,3,'','','multiple_choice','What does "mixed-use zoning" allow?',['A) Only residential buildings in one area','B) Residential, commercial, and recreational spaces to coexist','C) Factories to be built near schools','D) Cars to be banned in city centres'],'B'),
        q(40,3,'','','sentence_completion','Traditional urban development models that prioritised motor vehicle transport are being _____.',null,'reconsidered'),
    ];
}

// ---- PLATFORM TEST 2: LISTENING ----
function generatePT2Listening(centerId: string, testId: string) {
    const q = (num: number, sec: number, secTitle: string, type: string, text: string, opts: string[] | null, ans: string) => ({
        id: crypto.randomUUID(), centerId, test_id: testId, examType: 'academic',
        sectionNumber: sec, sectionTitle: secTitle, audioUrl: null,
        questionNumber: num, questionType: type, questionText: text,
        options: opts, correctAnswer: ans, points: 1,
    });

    return [
        // Section 1: Job Interview Preparation (Q1-10)
        q(1,1,'Job Interview Preparation','sentence_completion','The job position being discussed is a _____ role at a marketing firm.',null,'graduate trainee'),
        q(2,1,'','sentence_completion','The interview is scheduled for _____ at 10 AM.',null,'Thursday'),
        q(3,1,'','multiple_choice','What does the advisor recommend bringing to the interview?',['A) Only a CV','B) A portfolio and references','C) A letter from a professor','D) Nothing extra'],'B'),
        q(4,1,'','sentence_completion','The company was founded in _____ and specialises in digital marketing.',null,'2008'),
        q(5,1,'','true_false_not_given','The advisor suggests researching the company\'s recent campaigns.',null,'TRUE'),
        q(6,1,'','sentence_completion','The dress code for the interview is described as _____.',null,'smart casual'),
        q(7,1,'','multiple_choice','How long is the interview expected to last?',['A) 30 minutes','B) 45 minutes','C) 1 hour','D) 2 hours'],'C'),
        q(8,1,'','sentence_completion','The advisor recommends preparing at least _____ questions to ask the interviewer.',null,'three'),
        q(9,1,'','multiple_choice','What is the salary range mentioned for the position?',['A) £22,000–£25,000','B) £25,000–£28,000','C) £28,000–£32,000','D) £32,000–£36,000'],'B'),
        q(10,1,'','sentence_completion','The candidate is advised to arrive _____ minutes early.',null,'ten'),

        // Section 2: Museum Audio Guide (Q11-20)
        q(11,2,'Museum Audio Guide','multiple_choice','What is the museum\'s main focus?',['A) Natural history','B) Ancient civilisations','C) Modern art','D) Science and technology'],'D'),
        q(12,2,'','sentence_completion','The museum was opened in _____ by the local city council.',null,'1987'),
        q(13,2,'','multiple_choice','How many permanent exhibitions does the museum have?',['A) Four','B) Six','C) Eight','D) Ten'],'B'),
        q(14,2,'','sentence_completion','The interactive robotics display is located on the _____ floor.',null,'third'),
        q(15,2,'','true_false_not_given','Children under five are admitted free of charge.',null,'TRUE'),
        q(16,2,'','sentence_completion','The museum café closes at _____ on weekdays.',null,'5:30 PM'),
        q(17,2,'','multiple_choice','What is special about the Space Exploration exhibit?',['A) It has real moon rocks','B) It uses virtual reality','C) It was donated by NASA','D) It opens only on weekends'],'B'),
        q(18,2,'','sentence_completion','The gift shop is situated near the _____ entrance.',null,'main'),
        q(19,2,'','multiple_choice','When does the guided tour begin?',['A) 10:00 AM','B) 11:00 AM','C) 12:00 PM','D) 2:00 PM'],'B'),
        q(20,2,'','sentence_completion','The museum is closed every _____ for maintenance.',null,'Monday'),

        // Section 3: University Discussion (Q21-30)
        q(21,3,'University Research Discussion','multiple_choice','What is the topic of the students\' research project?',['A) Climate change adaptation in coastal cities','B) Renewable energy policy','C) Urban food security','D) Water management systems'],'A'),
        q(22,3,'','sentence_completion','The project supervisor has requested a preliminary draft by _____ of next month.',null,'the 15th'),
        q(23,3,'','multiple_choice','Which methodology does the supervisor recommend?',['A) Purely quantitative','B) Purely qualitative','C) Mixed methods','D) Case study only'],'C'),
        q(24,3,'','sentence_completion','The students plan to conduct interviews with _____ city council representatives.',null,'six'),
        q(25,3,'','true_false_not_given','The supervisor warns that secondary data sources should be used with caution.',null,'TRUE'),
        q(26,3,'','multiple_choice','What concern does one student raise about the timeline?',['A) The budget is too small','B) There is not enough time for data analysis','C) The topic is too broad','D) They lack access to participants'],'B'),
        q(27,3,'','sentence_completion','The final presentation is worth _____ percent of the module grade.',null,'40'),
        q(28,3,'','multiple_choice','What does the supervisor suggest regarding the literature review?',['A) It should be completed last','B) It should focus only on recent publications','C) It should be at least 3,000 words','D) It should include both historical and recent sources'],'D'),
        q(29,3,'','sentence_completion','The students agree to meet again in _____ weeks to review progress.',null,'two'),
        q(30,3,'','true_false_not_given','The supervisor recommends submitting the project before the deadline.',null,'TRUE'),

        // Section 4: Academic Lecture (Q31-40)
        q(31,4,'Lecture: The Psychology of Decision Making','sentence_completion','The lecture focuses on a concept known as _____ bias.',null,'confirmation'),
        q(32,4,'','multiple_choice','According to the lecturer, what percentage of decisions are influenced by unconscious bias?',['A) About 20%','B) About 50%','C) About 70%','D) About 90%'],'D'),
        q(33,4,'','sentence_completion','The study by Kahneman and Tversky is described as a landmark in the field of _____.',null,'behavioural economics'),
        q(34,4,'','true_false_not_given','The lecturer argues that humans are naturally rational decision-makers.',null,'FALSE'),
        q(35,4,'','multiple_choice','What is the "anchoring effect" described in the lecture?',['A) The tendency to rely too heavily on the first piece of information received','B) The tendency to follow the opinions of others','C) The inability to make decisions under pressure','D) The preference for familiar choices'],'A'),
        q(36,4,'','sentence_completion','The "sunk cost fallacy" refers to continuing an action because of _____ already invested.',null,'resources'),
        q(37,4,'','multiple_choice','What strategy does the lecturer suggest for improving decision-making?',['A) Making decisions alone','B) Acting on instinct','C) Seeking diverse perspectives','D) Avoiding all risk'],'C'),
        q(38,4,'','sentence_completion','The recommended reading for this topic is a book published in _____.',null,'2011'),
        q(39,4,'','true_false_not_given','The next lecture will cover the topic of memory and learning.',null,'TRUE'),
        q(40,4,'','sentence_completion','Students are asked to submit a reflection paper of _____ words.',null,'500'),
    ];
}

// ---- PLATFORM TEST 2: WRITING ----
function generatePT2Writing(centerId: string, testId: string) {
    return [
        {
            id: crypto.randomUUID(), centerId, test_id: testId, examType: 'academic',
            taskNumber: 1,
            taskPrompt: `The graph below shows the percentage of people using the internet in three different countries between 2005 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.`,
            wordLimitMin: 150,
            timeMinutes: 20,
        },
        {
            id: crypto.randomUUID(), centerId, test_id: testId, examType: 'academic',
            taskNumber: 2,
            taskPrompt: `In many countries, people are choosing to have children later in life than they did in the past. What are the reasons for this trend? Do the advantages outweigh the disadvantages?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.`,
            wordLimitMin: 250,
            timeMinutes: 40,
        },
    ];
}

// ---- PLATFORM TEST 2: SPEAKING ----
function generatePT2Speaking(centerId: string, testId: string) {
    return [
        // Part 1
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 1, questionText: 'Do you use the internet a lot? What do you mainly use it for?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 1, questionText: 'Do you prefer reading news online or in print? Why?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 1, questionText: 'How has technology changed the way you study or work?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 1, questionText: 'Do you think young people spend too much time on their phones?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 1, questionText: 'What kind of technology do you find most useful in daily life?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        // Part 2
        {
            id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 2,
            questionText: 'Describe a piece of technology that has had a significant impact on your life.',
            cueCardTopic: 'A piece of technology that has changed your life',
            cueCardPoints: [
                'What it is',
                'When you first started using it',
                'How it has changed your daily routine',
                'Why you think it is important'
            ],
            preparationTime: 60, speakingTime: 120,
        },
        // Part 3
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 3, questionText: 'How has the internet changed the way people communicate in society?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 3, questionText: 'Do you think artificial intelligence will replace human workers in the future?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 3, questionText: 'What responsibilities do technology companies have towards society?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 3, questionText: 'How can governments ensure that technology benefits everyone equally?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
        { id: crypto.randomUUID(), centerId, test_id: testId, partNumber: 3, questionText: 'Should social media companies be held responsible for harmful content on their platforms?', cueCardTopic: null, cueCardPoints: null, preparationTime: null, speakingTime: null },
    ];
}

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
