/** Platform Test 5 — Technology & Work (Academic). Original kontent. */

const P1 = `The office as most people knew it was an invention of the late nineteenth century, made possible
by three unglamorous technologies: the elevator, which allowed buildings to rise; the telephone, which
allowed managers to be separated from production; and the typewriter, which standardised the paperwork that
justified the whole arrangement. Its purpose was to bring workers to information, because information could
not easily be moved. That constraint disappeared decades ago, yet the arrangement it produced survived
almost unchanged until it was disrupted by an event no organisation had planned for.

The experiment that followed was unprecedented in scale. Within weeks in early 2020, a large fraction of
the world's office employees began working from home, and researchers who had spent years attempting to
recruit a few hundred volunteers for controlled trials suddenly had entire economies as their sample. The
findings that emerged were more mixed than either enthusiasts or critics had expected.

Productivity, the measure most often disputed, turned out to depend heavily on what was being counted. For
tasks that individuals complete alone and that have clear output, results were generally neutral or
positive. A frequently cited trial at a Chinese travel agency, conducted before the pandemic, found call
handling rose by thirteen per cent among home workers, most of the gain coming from fewer breaks and fewer
sick days. Studies of software engineers, however, recorded a decline in code output per hour alongside a
substantial increase in time spent in meetings, suggesting that some coordination that had previously
happened informally was being converted into scheduled events.

The clearest losses were in areas that are difficult to measure and slow to appear. Analysis of corporate
communication data found that collaboration networks became more static: employees interacted more
intensively with the people they already worked closely with, and formed far fewer connections outside
their immediate group. Since novel combinations of ideas typically arise at the boundaries between groups,
this raises a concern about innovation that would not show up in any quarterly figure. Junior staff were
affected most. Much of early-career learning is absorbed rather than taught, by overhearing how a
colleague handles a difficult client or watching a problem being argued through, and none of that survives
a scheduled video call with a fixed agenda.

The distribution of benefits has also proved uneven in ways that complicate the debate. Remote work
disproportionately advantages those with a spare room, reliable broadband and no caring responsibilities
during the day. Surveys consistently show that parents of young children, and people sharing accommodation,
report the most difficulty. There is also evidence of a proximity bias in promotion: in several
organisations, employees who attended the office more often were promoted at higher rates than remote
colleagues with equivalent performance ratings, which suggests that visibility is being rewarded
independently of output.

What has emerged is neither a return to the old pattern nor its abolition, but a hybrid arrangement that
most organisations have adopted without much theory behind it. The common model of two or three days in
the office is often implemented badly: employees attend on days determined by policy rather than by need,
and spend them in video calls with colleagues sitting elsewhere in the same building. Firms that report
satisfaction with hybrid working tend to have made a sharper distinction, treating the office as a place for
activities that benefit from being together, such as negotiation, training and difficult conversations,
while protecting home days for concentrated individual work.

The wider consequences are still unfolding. Demand for office space in central business districts has
fallen, and the businesses that depended on commuters, from sandwich shops to transport operators, have
been affected more severely than the employers themselves. Some cities are converting offices into housing,
though the economics are unfavourable because the deep floor plans that suit open-plan work produce
apartments with no windows. Meanwhile the ability to hire without regard to location has begun to shift
salaries in unexpected directions, raising them in smaller cities and putting downward pressure on the
premium that expensive ones could once command.`;

const P2 = `A

The most valuable ore deposits on earth are, by concentration, no longer underground. A tonne of
discarded mobile phones contains roughly a hundred times more gold than a tonne of gold ore. It also
contains copper, silver, palladium and a range of rare earth elements whose extraction from rock requires
enormous quantities of energy and produces significant pollution. Electronic waste is, viewed correctly,
an unusually rich and conveniently located mine.

B

It is also the fastest-growing waste stream in the world. Global production is estimated at over sixty
million tonnes a year and rising several times faster than the population. Less than a quarter is formally
collected and recycled. The remainder is incinerated, buried, stored in cupboards, or exported.

C

The reasons for this failure are partly technical. A modern smartphone contains around sixty different
elements, combined in assemblies that were designed for thinness and durability rather than separation.
Components are glued rather than screwed, batteries are sealed into cases, and the quantities involved are
minute: a single device may contain thirty milligrams of gold. Recovering it requires either high
temperature smelting, which destroys the plastics and releases the more volatile metals, or chemical
leaching, which is effective but generates hazardous effluent. No process currently recovers everything, and
each is economic only at scale.

D

The rest of the explanation is economic and legal. For decades the cheapest solution was to ship the
material to countries with low labour costs and limited regulation, where it was dismantled by hand.
Settlements such as Agbogbloshie in Ghana and Guiyu in China became internationally known for the practice
of burning cable insulation to recover copper and heating circuit boards over open flames to release solder.
Studies of these areas recorded lead concentrations in children's blood far above safe thresholds, along
with elevated levels of dioxins in soil and breast milk. The Basel Convention restricts the export of
hazardous waste, but shipments were routinely declared as second-hand goods for reuse, a category that is
genuinely important in countries where refurbished equipment extends access to technology, and which is
therefore difficult to police.

E

Three approaches are now being pursued. The first is to build capacity in the countries that generate the
waste, and modern facilities can recover more than ninety-five per cent of the metals in a circuit board
under controlled conditions. The obstacle is collection rather than processing: plants operate below
capacity because consumers do not return devices, and roughly half of unused phones in wealthy countries
are simply kept in drawers.

F

The second approach is to change the design of the products themselves. Extended producer responsibility
makes manufacturers financially liable for the disposal of what they sell, on the reasoning that a firm
paying for recycling will design for it. Repairability has become the subject of legislation in the
European Union and several American states, requiring manufacturers to supply spare parts and manuals, and
to score devices on how easily they can be opened. Critics point out that repairability scores measure
what is easy to measure and can be improved without any real change in how long a product lasts.

G

The third and least developed approach is to reduce the number of devices produced. Average replacement
intervals for smartphones have lengthened, from roughly two years to three, largely because improvements
between generations have become less noticeable. But total production continues to rise, driven by
first-time buyers in growing markets and by the multiplication of connected devices in homes, most of which
contain a chip, a battery and a wireless radio, and almost none of which are designed to be opened at all.`;

const P3 = `In 1954 a computer at Georgetown University translated sixty Russian sentences into English, and
the researchers announced that the problem of machine translation would be solved within five years. The
prediction was repeated, with adjustments, for the next fifty. Understanding why it was so persistently
wrong, and what eventually changed, says a good deal about the nature of language itself.

The first approach was the obvious one: give the machine a dictionary and a set of grammatical rules.
Linguists and programmers spent decades encoding these by hand, and the results were unusable for anything
beyond narrow technical domains. The difficulty was not vocabulary but ambiguity. Almost every sentence a
person produces has multiple possible readings, and the correct one is selected using knowledge of the
world rather than knowledge of grammar. The sentence "the trophy would not fit in the suitcase because it
was too large" is unambiguous to any reader, but only because the reader knows that trophies and suitcases
have sizes and that containers must exceed their contents. Change "large" to "small" and the pronoun
refers to the other noun. No rule about syntax can produce that judgement.

The second approach abandoned rules in favour of statistics. From the late 1980s, researchers took large
collections of documents that had been translated by humans, such as the proceedings of the Canadian
parliament in English and French, and calculated the probability that a given sequence in one language
corresponded to a sequence in the other. The system understood nothing, but it did not need to: it needed
only to select the most probable output. Quality improved markedly and became usable for getting the gist
of a text. The characteristic weakness was that translation proceeded in short fragments, so the output
was locally plausible and globally incoherent, with pronouns and tenses drifting between sentences.

The third shift came with neural networks. Rather than aligning fragments, these systems encode an entire
sentence into a numerical representation of its meaning and then generate the target sentence from that
representation, which allows information from the beginning of a sentence to influence the end. The
introduction of attention mechanisms in 2017 allowed models to weigh the relevance of every word to every
other word, and translation quality improved sharply enough that for some language pairs and text types,
professional translators judged the output comparable to human work.

The remaining limitations are instructive. Systems perform well where training data is abundant, which
means European languages and Chinese, and poorly for the majority of the world's seven thousand languages,
most of which have almost no digitised parallel text. This creates a self-reinforcing gap. Machines also
struggle with anything requiring cultural knowledge: humour, idiom, honorifics, and the levels of formality
that many languages encode grammatically. A system with no model of who is speaking to whom cannot reliably
choose between forms that a human selects without thinking.

There is also a documented tendency towards bias. Because output is generated by probability, a translation
from a language without gendered pronouns into one that requires them will select whichever gender is more
common in the training data, so that a sentence about a doctor becomes "he" and one about a nurse becomes
"she". This is not an error in the ordinary sense; the system is faithfully reproducing a statistical
pattern in human text. Correcting it requires deliberate intervention, and deciding what the corrected
output should be is a question about values rather than about engineering.

The effect on the profession has not been the elimination that was widely predicted. Demand for translation
has grown, because cheap machine output makes it feasible to translate material that would never have
justified the cost of a human translator, and a proportion of that material subsequently needs human
correction. What has changed is the work itself, which increasingly consists of editing machine output
rather than producing text from scratch, a task that many practitioners describe as less satisfying and
which is generally paid at a lower rate.`;

export default {
  title: 'Platform Test 5 — Technology & Work',
  examType: 'academic',

  reading: [
    {
      passageNumber: 1,
      title: 'The Future of the Office',
      text: P1,
      questions: [
        { type: 'true_false_not_given', text: 'The office was made possible partly by the invention of the elevator.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'The constraint that produced the office disappeared only in 2020.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'Call handling improved among home workers in the Chinese travel agency trial.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'Software engineers produced more code per hour when working from home.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'Collaboration networks became more static when employees worked remotely.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'Companies that adopted hybrid working reported higher profits than those that did not.', answer: 'NOT GIVEN' },
        { type: 'true_false_not_given', text: 'Employees with caring responsibilities find remote work easiest of all.', answer: 'FALSE' },
        { type: 'sentence_completion', text: 'Remote work particularly favours those with a spare ________ and a reliable connection.', answer: 'room' },
        { type: 'sentence_completion', text: 'Several organisations show a proximity ________ when deciding on promotions.', answer: 'bias' },
        { type: 'sentence_completion', text: 'Converting offices into homes is difficult because deep floor ________ produce apartments with no windows.', answer: 'plans' },
        {
          type: 'multiple_choice',
          text: 'According to the passage, the original purpose of the office was to',
          options: ['A) reduce the cost of rent', 'B) bring workers to information', 'C) display the status of a company', 'D) shorten the journey to work'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'Firms that report satisfaction with hybrid working tend to',
          options: [
            'A) require attendance five days a week',
            'B) leave the choice entirely to employees',
            'C) reserve office days for work that benefits from being together',
            'D) abolish meetings altogether',
          ],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'The passage says that hiring without regard to location has',
          options: [
            'A) lowered salaries in every market',
            'B) raised salaries in smaller cities',
            'C) had no measurable effect on pay',
            'D) increased demand for central offices',
          ],
          answer: 'B',
        },
      ],
    },
    {
      passageNumber: 2,
      title: 'The Problem of Electronic Waste',
      text: P2,
      questions: [
        { type: 'matching_features', text: 'Manufacturers are made financially liable for the disposal of what they sell.', options: ['@Match each statement with the correct approach, A, B or C.', 'A) building recycling capacity', 'B) changing product design', 'C) reducing the number of devices'], answer: 'B' },
        { type: 'matching_features', text: 'Plants run below capacity because consumers do not return their old devices.', answer: 'A' },
        { type: 'matching_features', text: 'Replacement intervals have lengthened as differences between generations shrink.', answer: 'C' },
        { type: 'matching_features', text: 'Legislation requires spare parts and manuals to be made available.', answer: 'B' },
        { type: 'sentence_completion', text: 'A tonne of discarded mobile phones contains about a hundred times more ________ than a tonne of ore.', answer: 'gold' },
        { type: 'sentence_completion', text: 'A modern smartphone contains around ________ different elements.', answer: 'sixty' },
        { type: 'sentence_completion', text: 'Components are ________ rather than screwed, which makes separation harder.', answer: 'glued' },
        { type: 'sentence_completion', text: 'Chemical ________ recovers metals effectively but generates hazardous effluent.', answer: 'leaching' },
        { type: 'sentence_completion', text: 'Shipments of waste were routinely declared as second-hand goods for ________.', answer: 'reuse' },
        { type: 'matching_information', text: 'a comparison between the metal content of waste and that of natural ore', options: ['@Which paragraph contains the following information?', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], answer: 'A' },
        { type: 'matching_information', text: 'figures showing how small a share of the waste stream is properly handled', answer: 'B' },
        { type: 'matching_information', text: 'an explanation of why the devices themselves are hard to take apart', answer: 'C' },
        { type: 'matching_information', text: 'an account of health damage recorded in particular settlements', answer: 'D' },
      ],
    },
    {
      passageNumber: 3,
      title: 'The Long Road to Machine Translation',
      text: P3,
      questions: [
        { type: 'yes_no_not_given', text: 'The prediction made in 1954 about machine translation proved to be accurate.', answer: 'NO' },
        { type: 'yes_no_not_given', text: 'Ambiguity rather than vocabulary was the main obstacle for rule-based systems.', answer: 'YES' },
        { type: 'yes_no_not_given', text: 'Statistical systems understood the texts that they translated.', answer: 'NO' },
        { type: 'yes_no_not_given', text: 'Neural systems allow the beginning of a sentence to influence its ending.', answer: 'YES' },
        { type: 'yes_no_not_given', text: 'Machine translation works about equally well for most of the languages of the world.', answer: 'NO' },
        { type: 'yes_no_not_given', text: 'Deciding how biased output should be corrected is a question about values.', answer: 'YES' },
        { type: 'yes_no_not_given', text: 'Most professional translators have now retrained for other kinds of work.', answer: 'NOT GIVEN' },
        { type: 'summary_completion', text: 'Three approaches — The earliest systems were given a dictionary together with a set of ________ rules.', options: ['@Complete the summary below.'], answer: 'grammatical' },
        { type: 'summary_completion', text: 'From the late 1980s researchers instead calculated the ________ that a sequence in one language corresponded to a sequence in the other.', answer: 'probability' },
        { type: 'summary_completion', text: 'The typical weakness of that method was output that was locally plausible but globally ________.', answer: 'incoherent' },
        { type: 'summary_completion', text: 'Neural systems encode an entire sentence into a numerical ________ of its meaning.', answer: 'representation' },
        {
          type: 'multiple_choice',
          text: 'The example of the trophy and the suitcase is used to show that',
          options: [
            'A) dictionaries remain incomplete',
            'B) knowledge of the world is needed to resolve a pronoun',
            'C) grammatical rules alone are sufficient',
            'D) Russian is unusually difficult to translate',
          ],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'The attention mechanisms introduced in 2017 allowed models to',
          options: [
            'A) train without any data at all',
            'B) operate in real time',
            'C) weigh the relevance of every word to every other word',
            'D) remove bias automatically',
          ],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'According to the passage, demand for translation has',
          options: ['A) disappeared entirely', 'B) grown', 'C) remained unchanged', 'D) moved completely to machines'],
          answer: 'B',
        },
      ],
    },
  ],

  listening: [
    {
      sectionNumber: 1,
      title: 'Section 1 — Enquiry about a Coworking Space',
      questions: [
        { type: 'form_completion', text: 'Caller\'s name: Daniel ________', answer: 'Ferreira' },
        { type: 'form_completion', text: 'Type of desk required: ________ desk', answer: 'hot' },
        { type: 'form_completion', text: 'Monthly price: £________', answer: '180' },
        { type: 'form_completion', text: 'Access hours: ________ a day for members', answer: '24' },
        { type: 'form_completion', text: 'Meeting rooms cost £________ per hour.', answer: '15' },
        { type: 'form_completion', text: 'The building is on ________ Street.', answer: 'Hanover' },
        { type: 'form_completion', text: 'Nearest station: ________ Park', answer: 'Victoria' },
        { type: 'form_completion', text: 'Free trial lasts ________ days.', answer: 'three' },
        { type: 'form_completion', text: 'Members must not use the ________ area for phone calls.', answer: 'quiet' },
        { type: 'form_completion', text: 'Contract notice period: ________ month', answer: 'one' },
      ],
    },
    {
      sectionNumber: 2,
      title: 'Section 2 — Briefing on a New Recycling Scheme',
      questions: [
        {
          type: 'multiple_choice',
          text: 'The new scheme applies to',
          options: ['A) all households in the district', 'B) houses but not flats', 'C) businesses as well as homes'],
          answer: 'A',
        },
        {
          type: 'multiple_choice',
          text: 'The most common mistake residents make is',
          options: ['A) using the wrong bag', 'B) including food waste', 'C) not rinsing containers'],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'The recycling centre on Mill Lane is open',
          options: ['A) five days a week', 'B) six days a week', 'C) seven days a week'],
          answer: 'C',
        },
        { type: 'matching_features', text: 'electronic items', options: ['@What should residents do with each of the following? Choose A, B or C.', 'A) take it to a collection point', 'B) leave it in a clear bag on top of the bin', 'C) book a collection online'], answer: 'A' },
        { type: 'matching_features', text: 'batteries', answer: 'B' },
        { type: 'matching_features', text: 'large items such as furniture', answer: 'C' },
        { type: 'note_completion', text: 'Collections take place every ________ weeks.', options: ['@Complete the notes below.'], answer: 'two|2' },
        { type: 'note_completion', text: 'At weekends the recycling centre stays open until ________.', answer: 'six|6|6pm' },
        { type: 'note_completion', text: 'The council aims to recycle ________ per cent of waste by 2030.', answer: '65' },
        { type: 'note_completion', text: 'Information leaflets are available in ________ languages.', answer: 'six|6' },
      ],
    },
    {
      sectionNumber: 3,
      title: 'Section 3 — Students Preparing a Presentation on Automation',
      questions: [
        {
          type: 'multiple_choice',
          text: 'They decide the presentation should focus on',
          options: ['A) manufacturing', 'B) office work', 'C) transport'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'The woman thinks their introduction is',
          options: ['A) too short', 'B) too technical', 'C) too general'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'They agree that it would be most valuable to interview',
          options: ['A) a professor', 'B) another student', 'C) a company manager'],
          answer: 'C',
        },
        { type: 'sentence_completion', text: 'The presentation must last ________ minutes.', options: ['@Complete the sentences below.'], answer: '15|fifteen' },
        { type: 'sentence_completion', text: 'They will use no more than ________ slides.', answer: '12|twelve' },
        { type: 'sentence_completion', text: 'They plan to rehearse on ________ evening.', answer: 'Sunday' },
        { type: 'sentence_completion', text: 'The presentation takes place in room ________.', answer: '304' },
        { type: 'matching_features', text: 'preparing the conclusion section', options: ['@Who will prepare each part? Choose A, B or C.', 'A) the woman', 'B) the man', 'C) both students together'], answer: 'A' },
        { type: 'matching_features', text: 'preparing the introduction and the case study', answer: 'B' },
        { type: 'matching_features', text: 'putting together the list of sources', answer: 'A' },
      ],
    },
    {
      sectionNumber: 4,
      title: 'Section 4 — Lecture: Skills for a Changing Labour Market',
      questions: [
        { type: 'note_completion', text: 'Routine ________ tasks are the most easily automated.', answer: 'cognitive' },
        { type: 'note_completion', text: 'Jobs requiring manual ________ in unpredictable settings resist automation.', answer: 'dexterity' },
        { type: 'note_completion', text: 'Automation tends to change tasks rather than eliminate whole ________.', answer: 'occupations' },
        { type: 'note_completion', text: 'Demand is rising for skills involving ________ intelligence.', answer: 'social' },
        { type: 'note_completion', text: 'Workers now change ________ far more often than previous generations.', answer: 'careers' },
        { type: 'note_completion', text: 'Lifelong ________ has become a policy priority.', answer: 'learning' },
        { type: 'note_completion', text: 'Short courses leading to a ________ are increasingly popular.', answer: 'certificate' },
        { type: 'note_completion', text: 'Employers report a shortage of workers with ________ skills.', answer: 'digital' },
        { type: 'note_completion', text: 'Retraining programmes work best when combined with income ________.', answer: 'support' },
        { type: 'note_completion', text: 'The lecturer concludes that the pace of ________ is the central challenge.', answer: 'change' },
      ],
    },
  ],

  writing: [
    {
      taskNumber: 1,
      prompt:
        'The chart below shows the percentage of employees working mainly from home in five sectors in 2019 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
      wordLimitMin: 150,
      timeMinutes: 20,
    },
    {
      taskNumber: 2,
      prompt:
        'Some people believe that new technology in the workplace has made working life more difficult, while others think it has improved conditions for employees.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.',
      wordLimitMin: 250,
      timeMinutes: 40,
    },
  ],

  speaking: [
    { partNumber: 1, text: 'Do you work or are you a student?' },
    { partNumber: 1, text: 'What kind of technology do you use every day?' },
    { partNumber: 1, text: 'Would you like to work from home? Why or why not?' },
    { partNumber: 1, text: 'How do you usually communicate with friends?' },
    { partNumber: 1, text: 'Do you think you spend too much time on your phone?' },
    { partNumber: 1, text: 'How often do you buy new electronic devices?' },
    { partNumber: 1, text: 'What do you do with old phones or computers?' },
    { partNumber: 1, text: 'Do you find it easy to learn new software?' },
    {
      partNumber: 2,
      text: 'Describe a piece of technology that has changed your daily life.',
      cueCardTopic: 'A piece of technology that changed your life',
      cueCardPoints: ['what it is', 'when you started using it', 'how you use it', 'and explain how it has changed things for you'],
      preparationTime: 60,
      speakingTime: 120,
    },
    { partNumber: 3, text: 'Do you think machines will replace many jobs in the future?' },
    { partNumber: 3, text: 'What skills will be most valuable in twenty years?' },
    { partNumber: 3, text: 'Should companies be responsible for retraining workers?' },
    { partNumber: 3, text: 'How has technology changed the relationship between work and home life?' },
    { partNumber: 3, text: 'Do you think older people are disadvantaged by rapid technological change?' },
  ],
};
