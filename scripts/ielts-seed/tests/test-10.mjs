/** Platform Test 10 — Space & Engineering (Academic). Original kontent. */

const P1 = `On 4 October 1957 there was one artificial object in orbit around the Earth. There are now some
forty thousand pieces large enough to be tracked from the ground, of which fewer than a quarter are working
satellites. The rest is debris: spent rocket stages, dead spacecraft, fragments of both, and objects lost
during spacewalks including a camera, a spatula and a bag of tools. Estimates of fragments too small to
track but large enough to destroy a satellite run to well over a million.

The danger is a consequence of speed rather than mass. An object in low Earth orbit travels at
approximately twenty-eight thousand kilometres per hour, and collisions between objects in different orbits
can occur at more than twice that closing speed. At such velocities a fleck of paint can pit a window and a
fragment the size of a marble carries roughly the kinetic energy of a small car at motorway speed. Shielding
can be designed against particles up to about a centimetre; above that, the only defence is to move out of
the way, and the International Space Station has performed such manoeuvres more than thirty times.

Two events transformed the problem from theory into arithmetic. In 2007 China destroyed one of its own
weather satellites in a missile test, generating over three thousand trackable fragments in a densely used
orbit, the largest single debris-creating event in history. Two years later an operational American
communications satellite collided with a defunct Russian military satellite over Siberia, producing around
two thousand more. Between them these two incidents increased the tracked debris population by roughly a
third.

The underlying concern was described in 1978 by Donald Kessler, who pointed out that above a certain
density, collisions generate fragments faster than atmospheric drag removes them. Each collision raises the
probability of the next, and the process becomes self-sustaining regardless of whether anything further is
launched. The Kessler syndrome does not imply that space becomes impassable overnight; it implies that
particular orbital bands could become progressively unusable over decades, and that the process, once
established, cannot be stopped by ceasing to launch.

Mitigation is now standard practice and its logic is simple: reduce what is added. Rocket stages are vented
of residual fuel to prevent explosions, which historically caused a large share of fragmentation events.
Satellites in low orbit are required by guidelines to be de-orbited within twenty-five years of the end of
their mission, a period some agencies have recently shortened to five. Those in the high geostationary belt,
where atmospheric drag is negligible, are raised into a graveyard orbit several hundred kilometres above.
Compliance has improved but remains incomplete, and the guidelines are not binding law.

Removal of what is already there is harder. The proposals include nets, harpoons, magnetic capture and
lasers that ablate a surface to nudge an object into a lower orbit. Several have been demonstrated in
orbit, but the economics are unattractive: each mission removes one or a small number of objects at
substantial cost, and no one has an obvious obligation to pay. There is also a legal obstacle that is
frequently overlooked. Under the Outer Space Treaty, a launching state retains ownership of its object
indefinitely, so approaching another country's dead satellite without permission is not permitted, and any
technology capable of capturing a satellite is also capable of disabling one, which makes such systems
diplomatically sensitive.

The situation is being changed by scale. Constellations of thousands of small satellites in low orbit are
now being deployed for broadband, and the number in orbit has roughly quintupled in a decade. Operators
argue that modern spacecraft are manoeuvrable, short-lived and de-orbit reliably, which is broadly true.
The counter-argument is that the collision risk in a given shell rises with the square of the number of
objects, that reliability is never total, and that a single operator's failure imposes costs on everyone
using that altitude. Astronomers have raised a separate objection about reflected sunlight interfering with
observation, which has already required changes to the way some survey telescopes process their data.`;

const P2 = `A bridge is the clearest case in engineering of a structure whose form is dictated by the
problem it solves. Every bridge must carry its own weight, the weight of what crosses it, and the forces
imposed by wind, temperature and, in some regions, earthquakes. There are only a small number of ways to do
this, and they have been known for a long time.

The beam is the simplest: a horizontal member supported at each end. Load causes it to bend, compressing
the top and stretching the bottom, and its capacity falls sharply as the span increases, because the beam's
own weight grows faster than its strength. Beams are therefore short, and long beam bridges are built as a
series of short spans on piers.

The arch converts the downward load into compression that runs along the curve to the abutments at each end.
Stone is very strong in compression and weak in tension, so the arch was the only way to build a large
masonry span, and Roman engineers exploited it for bridges and aqueducts that in some cases still stand.
The arch imposes a demanding condition: the abutments must resist a substantial outward thrust, which
requires solid ground or a very heavy structure at each end.

The suspension bridge inverts the arch. The deck hangs from cables that take the load in pure tension and
carry it to towers and then to anchorages in the ground. Steel is exceptionally strong in tension and can be
drawn into wire, so suspension bridges achieve by far the longest spans, currently over two kilometres. The
cost is stiffness: a structure held by cables is light and flexible, and flexibility is what makes it
vulnerable to wind.

That vulnerability produced the discipline's most instructive failure. The Tacoma Narrows Bridge in
Washington State opened in July 1940 and collapsed four months later in a wind of only about sixty-eight
kilometres per hour, far below its design load. The deck had been built unusually shallow and solid, and in
steady wind it began to twist, each oscillation feeding the next until the structure tore itself apart. The
event is often described as resonance, which is not quite right; the accepted explanation is aeroelastic
flutter, in which the motion of the structure alters the airflow in a way that adds energy to the motion.
The lesson was that a bridge must be analysed as an object interacting with moving air, not merely as a
frame carrying static loads, and modern long-span decks are shaped like aerofoils and tested in wind
tunnels for this reason.

The cable-stayed bridge, in which cables run directly from tower to deck rather than hanging from a main
cable, has become the dominant form for spans between about two hundred metres and one kilometre. It is
stiffer than a suspension bridge, requires no massive anchorages, and can be built outwards from each tower
in balanced segments, which avoids obstructing what lies beneath. Advances in computation made it
practical, since the forces in a structure with dozens of cables of differing length and tension are
laborious to calculate by hand.

The problems that now dominate the profession are not those of building. A large proportion of the bridges
in wealthy countries were constructed in a concentrated period after the Second World War and are
approaching the end of their design lives simultaneously. Assessments regularly classify tens of thousands
of structures as deficient. Reinforced concrete deteriorates in a specific and predictable way: water
carrying chloride from road salt or sea air penetrates the concrete, the steel reinforcement inside
corrodes, and because rust occupies more volume than the steel it replaces, it cracks the concrete from
within and admits more water. The process is slow, invisible from outside for years, and expensive to
arrest. Sensors embedded in new structures now report strain and corrosion continuously, which allows
maintenance to be scheduled by condition rather than by calendar — an unglamorous development that will
probably save more lives than any advance in span length.`;

const P3 = `A

Antarctica is governed by an agreement that should not have worked. Signed in 1959 by twelve
countries, including the United States and the Soviet Union at the height of the Cold War, the Antarctic
Treaty set aside all territorial claims without resolving them, prohibited military activity and nuclear
testing, and dedicated the continent to peaceful scientific research with a requirement that findings be
freely exchanged. It has been observed ever since, and now has more than fifty parties.

B

The scientific case for the continent is that it preserves records available nowhere else. Ice accumulates
annually and does not melt, so a vertical core through the sheet is a chronological sequence. Bubbles
trapped within it contain samples of the actual atmosphere at the moment the snow compacted, which allows
past concentrations of carbon dioxide and methane to be measured directly rather than inferred. Cores from
the East Antarctic plateau extend back eight hundred thousand years, covering eight glacial cycles, and a
project drilling for older ice aims to reach a period, around a million years ago, when the rhythm of the
ice ages changed for reasons that remain unexplained.

C

The single most consequential Antarctic discovery was not planned. The British Antarctic Survey had
monitored stratospheric ozone at Halley Station since 1957, an unremarkable routine that continued for
decades. In the early 1980s the readings for spring began to fall sharply. The team checked their equipment,
replaced it, and withheld publication for two years while verifying the result, partly because satellite
instruments had recorded the same values and discarded them automatically as errors outside the range
considered physically plausible. The 1985 paper announcing a seasonal hole in the ozone layer over
Antarctica led within two years to the Montreal Protocol, the most effective environmental treaty yet
concluded, and the ozone layer is now recovering. The episode is regularly cited as an argument for
long-term monitoring whose value cannot be demonstrated in advance.

D

Working there remains difficult in ways that are easy to underestimate. The interior receives no sunlight
for months, temperatures at the highest stations fall below minus eighty degrees Celsius, and the air is
extremely dry. Everything must be transported in, and everything, including waste, must now be transported
out under environmental protocols agreed in 1991. Winter crews are isolated for months with no possibility
of evacuation, and the psychological effects have been studied closely enough that space agencies treat
Antarctic stations as analogues for long-duration missions, examining sleep disruption, group conflict and
the cognitive effects of monotony.

E

The most urgent current research concerns the stability of the ice itself. West Antarctica's ice sheet
rests on bedrock that lies below sea level and slopes downward inland, a configuration that may be unstable:
warm ocean water can reach the grounding line where ice begins to float, melt it from beneath, and cause
the line to retreat into deeper water, where melting is faster still. Whether this process has begun in
particular glaciers is contested, and it matters enormously, since the ice held in that sheet corresponds to
several metres of global sea level. The uncertainty in long-range sea level projections is dominated by this
single question.

F

The political settlement is under quieter pressure than the ice. The treaty's prohibition on mineral
extraction is subject to review after 2048, and interest in fisheries, particularly krill, has grown
substantially. Krill are the foundation of the entire Southern Ocean food web, and the catch is increasingly
concentrated in exactly the coastal areas where penguins and seals feed. Decisions require consensus among
the parties, which has repeatedly prevented the creation of proposed marine protected areas. The mechanism
that has kept the continent peaceful for sixty years is the same one that now makes it difficult to protect.`;

export default {
  title: 'Platform Test 10 — Space & Engineering',
  examType: 'academic',

  reading: [
    {
      passageNumber: 1,
      title: 'The Problem of Space Debris',
      text: P1,
      questions: [
        { type: 'true_false_not_given', text: 'Fewer than a quarter of the tracked objects in orbit are working satellites.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'Shielding can be designed to protect a spacecraft against debris of any size.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'The 2007 missile test was the largest single debris-creating event in history.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'The Kessler syndrome means that space would become impassable within days.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'Explosions have created more debris than collisions have.', answer: 'NOT GIVEN' },
        { type: 'sentence_completion', text: 'Rocket stages are ________ of residual fuel so that they do not explode later.', answer: 'vented' },
        { type: 'sentence_completion', text: 'Satellites in the geostationary belt are raised into a ________ orbit at the end of their lives.', answer: 'graveyard' },
        { type: 'sentence_completion', text: 'Under the Outer Space Treaty a launching state keeps ________ of its object indefinitely.', answer: 'ownership' },
        { type: 'sentence_completion', text: 'Astronomers have objected to reflected ________ interfering with observation.', answer: 'sunlight' },
        {
          type: 'multiple_choice',
          text: 'The danger presented by debris arises mainly from',
          options: ['A) the mass of the objects', 'B) the speed at which they travel', 'C) extremes of temperature', 'D) magnetic effects'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'The collision that occurred over Siberia in 2009 involved',
          options: [
            'A) two American satellites',
            'B) two Russian satellites',
            'C) an operational American satellite and a defunct Russian one',
            'D) a satellite and the International Space Station',
          ],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'Removal missions are described as economically unattractive because',
          options: [
            'A) they are technically impossible at present',
            'B) lasers have never been demonstrated in orbit',
            'C) each mission removes very few objects at high cost and no one is obliged to pay',
            'D) they are forbidden by treaty',
          ],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'According to the counter-argument, collision risk in a given shell rises with',
          options: [
            'A) the number of objects',
            'B) the square of the number of objects',
            'C) the cube of the number of objects',
            'D) the altitude of the shell',
          ],
          answer: 'B',
        },
      ],
    },
    {
      passageNumber: 2,
      title: 'How Bridges Stand Up',
      text: P2,
      questions: [
        { type: 'matching_features', text: 'Its capacity falls sharply as the span becomes longer.', options: ['@Match each statement with the correct type of bridge, A, B, C or D.', 'A) the beam', 'B) the arch', 'C) the suspension bridge', 'D) the cable-stayed bridge'], answer: 'A' },
        { type: 'matching_features', text: 'It requires the ground at each end to resist a strong outward thrust.', answer: 'B' },
        { type: 'matching_features', text: 'It achieves the longest spans but is light and flexible.', answer: 'C' },
        { type: 'matching_features', text: 'It can be built outwards from each tower in balanced segments.', answer: 'D' },
        { type: 'matching_features', text: 'It turns a downward load into compression running along a curve.', answer: 'B' },
        { type: 'sentence_completion', text: 'Stone is very strong in compression and weak in ________.', answer: 'tension' },
        { type: 'sentence_completion', text: 'The accepted explanation for the Tacoma Narrows collapse is aeroelastic ________.', answer: 'flutter' },
        { type: 'sentence_completion', text: 'Modern long-span decks are shaped like ________ and tested in wind tunnels.', answer: 'aerofoils' },
        { type: 'sentence_completion', text: 'Rust occupies more ________ than the steel it replaces, so it cracks the concrete from inside.', answer: 'volume' },
        { type: 'true_false_not_given', text: 'The Tacoma Narrows Bridge failed in a wind stronger than the load it was designed for.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'Cable-stayed bridges require massive anchorages in the ground.', answer: 'FALSE' },
        { type: 'true_false_not_given', text: 'Embedded sensors allow maintenance to be scheduled by condition rather than by calendar.', answer: 'TRUE' },
        { type: 'true_false_not_given', text: 'Most of the bridges classified as deficient are in coastal regions.', answer: 'NOT GIVEN' },
      ],
    },
    {
      passageNumber: 3,
      title: 'Science at the End of the Earth',
      text: P3,
      questions: [
        { type: 'matching_information', text: 'an explanation of why trapped bubbles allow past air to be measured directly', options: ['@Which paragraph contains the following information?', 'A', 'B', 'C', 'D', 'E', 'F'], answer: 'B' },
        { type: 'matching_information', text: 'an account of readings that an automatic system rejected as implausible', answer: 'C' },
        { type: 'matching_information', text: 'a description of how the stations are used to study isolation', answer: 'D' },
        { type: 'matching_information', text: 'an explanation of why a particular bedrock configuration may be unstable', answer: 'E' },
        { type: 'matching_information', text: 'a reference to a prohibition that is due to be reviewed', answer: 'F' },
        {
          type: 'multiple_choice',
          text: 'The Antarctic Treaty was signed in',
          options: ['A) 1948', 'B) 1957', 'C) 1959', 'D) 1991'],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'Ice cores from the East Antarctic plateau extend back approximately',
          options: ['A) eight thousand years', 'B) eighty thousand years', 'C) eight hundred thousand years', 'D) eight million years'],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'The ozone result was withheld for two years because the team',
          options: [
            'A) lacked the funding needed to publish',
            'B) were verifying the measurement',
            'C) were waiting for government permission',
            'D) had lost their original records',
          ],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'Decisions on proposed marine protected areas require',
          options: [
            'A) a simple majority vote',
            'B) approval by the United Nations',
            'C) consensus among the parties',
            'D) proof of harm to wildlife',
          ],
          answer: 'C',
        },
        { type: 'summary_completion', text: 'The Antarctic Treaty — The agreement set aside all ________ claims without resolving them.', options: ['@Complete the summary below.'], answer: 'territorial' },
        { type: 'summary_completion', text: 'It prohibited military activity and ________ testing on the continent.', answer: 'nuclear' },
        { type: 'summary_completion', text: 'Under protocols agreed in 1991, everything brought in, including ________, must be taken out again.', answer: 'waste' },
        { type: 'summary_completion', text: 'Warm ocean water can reach the ________ line, where the ice begins to float.', answer: 'grounding' },
        { type: 'summary_completion', text: 'Interest in fisheries, and particularly in ________, has grown substantially.', answer: 'krill' },
      ],
    },
  ],

  listening: [
    {
      sectionNumber: 1,
      title: 'Section 1 — Booking a Place at an Observatory Open Evening',
      questions: [
        { type: 'form_completion', text: 'Name: Rachel ________', answer: 'Duffy' },
        { type: 'form_completion', text: 'Number of tickets: ________', answer: 'four' },
        { type: 'form_completion', text: 'Date of visit: ________ of March', answer: '8th' },
        { type: 'form_completion', text: 'Ticket price for adults: £________', answer: '9' },
        { type: 'form_completion', text: 'The event begins at ________.', answer: '7.30' },
        { type: 'form_completion', text: 'Visitors should bring a ________ if it is cold.', answer: 'blanket' },
        { type: 'form_completion', text: 'The observatory is on ________ Hill.', answer: 'Bidston' },
        { type: 'form_completion', text: 'The talk is about the planet ________.', answer: 'Saturn' },
        { type: 'form_completion', text: 'Events are cancelled if the sky is ________.', answer: 'cloudy' },
        { type: 'form_completion', text: 'Confirmation is sent by ________.', answer: 'text' },
      ],
    },
    {
      sectionNumber: 2,
      title: 'Section 2 — Introduction to an Engineering Museum',
      questions: [
        {
          type: 'multiple_choice',
          text: 'The museum\'s main exhibit is',
          options: ['A) a steam engine', 'B) a suspension bridge model', 'C) an aircraft', 'D) a printing press'],
          answer: 'A',
        },
        {
          type: 'multiple_choice',
          text: 'The workshop demonstrations take place',
          options: ['A) every hour', 'B) twice a day', 'C) at weekends only', 'D) by appointment'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'Children under twelve must',
          options: ['A) pay half price', 'B) be accompanied by an adult', 'C) join a guided tour', 'D) wear protective glasses'],
          answer: 'B',
        },
        { type: 'note_completion', text: 'The building was originally a railway ________.', answer: 'workshop' },
        { type: 'note_completion', text: 'The collection contains over ________ objects.', answer: '12000' },
        { type: 'note_completion', text: 'The bridge gallery is on the ________ floor.', answer: 'first' },
        { type: 'note_completion', text: 'A new gallery on ________ energy opens in June.', answer: 'renewable' },
        { type: 'note_completion', text: 'Volunteers restore machinery in the ________ shed.', answer: 'engine' },
        { type: 'note_completion', text: 'Photography without ________ is permitted.', answer: 'flash' },
        { type: 'note_completion', text: 'The museum shop closes ________ minutes before the museum.', answer: '30' },
      ],
    },
    {
      sectionNumber: 3,
      title: 'Section 3 — Students Discussing a Design Project',
      questions: [
        {
          type: 'multiple_choice',
          text: 'Their project involves designing a',
          options: ['A) footbridge', 'B) wind turbine', 'C) water pump', 'D) solar panel'],
          answer: 'A',
        },
        {
          type: 'multiple_choice',
          text: 'The main constraint is',
          options: ['A) cost', 'B) available materials', 'C) the span required', 'D) construction time'],
          answer: 'C',
        },
        {
          type: 'multiple_choice',
          text: 'The woman prefers a design that is',
          options: ['A) cheapest', 'B) easiest to maintain', 'C) quickest to build', 'D) most attractive'],
          answer: 'B',
        },
        {
          type: 'multiple_choice',
          text: 'They still need to calculate',
          options: ['A) wind loading', 'B) material costs', 'C) foundation depth', 'D) pedestrian numbers'],
          answer: 'A',
        },
        { type: 'sentence_completion', text: 'The bridge must span ________ metres.', answer: '35' },
        { type: 'sentence_completion', text: 'They will build a scale ________ for the presentation.', answer: 'model' },
        { type: 'sentence_completion', text: 'The design must last at least ________ years.', answer: '60' },
        { type: 'sentence_completion', text: 'The man will run the ________ simulation.', answer: 'stress' },
        { type: 'sentence_completion', text: 'Their budget is £________ thousand.', answer: '400' },
        { type: 'sentence_completion', text: 'The report is submitted in ________.', answer: 'April' },
      ],
    },
    {
      sectionNumber: 4,
      title: 'Section 4 — Lecture: Living and Working in Extreme Environments',
      questions: [
        { type: 'note_completion', text: 'Antarctic winter crews are isolated with no possibility of ________.', answer: 'evacuation' },
        { type: 'note_completion', text: 'Continuous darkness disrupts the body\'s ________ rhythm.', answer: 'circadian' },
        { type: 'note_completion', text: 'Small groups in isolation are prone to interpersonal ________.', answer: 'conflict' },
        { type: 'note_completion', text: 'Monotony has measurable effects on ________ performance.', answer: 'cognitive' },
        { type: 'note_completion', text: 'Crew ________ is now a major factor in selection.', answer: 'compatibility' },
        { type: 'note_completion', text: 'Regular ________ with family improves wellbeing.', answer: 'contact' },
        { type: 'note_completion', text: 'Stations are used as ________ for long space missions.', answer: 'analogues' },
        { type: 'note_completion', text: 'Everything including ________ must be removed from Antarctica.', answer: 'waste' },
        { type: 'note_completion', text: 'Structured ________ helps maintain morale during winter.', answer: 'routine' },
        { type: 'note_completion', text: 'The lecturer says the greatest challenge is ________ rather than physical.', answer: 'psychological' },
      ],
    },
  ],

  writing: [
    {
      taskNumber: 1,
      prompt:
        'The chart below shows the number of objects launched into space by five countries between 1990 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
      wordLimitMin: 150,
      timeMinutes: 20,
    },
    {
      taskNumber: 2,
      prompt:
        'Space exploration requires enormous amounts of money. Some people believe that these resources should be used to improve infrastructure and services on Earth instead.\n\nTo what extent do you agree or disagree?\n\nWrite at least 250 words.',
      wordLimitMin: 250,
      timeMinutes: 40,
    },
  ],

  speaking: [
    { partNumber: 1, text: 'Are you interested in space or astronomy?' },
    { partNumber: 1, text: 'Have you ever looked at the stars through a telescope?' },
    { partNumber: 1, text: 'Are there any impressive buildings or bridges in your city?' },
    { partNumber: 1, text: 'Do you enjoy watching documentaries?' },
    { partNumber: 1, text: 'Would you like to travel to space if you had the chance?' },
    { partNumber: 1, text: 'Do you think you could live somewhere very cold?' },
    { partNumber: 1, text: 'What kind of weather do you like least?' },
    { partNumber: 1, text: 'Did you build things or take them apart as a child?' },
    {
      partNumber: 2,
      text: 'Describe an impressive structure or building you have seen.',
      cueCardTopic: 'An impressive structure or building',
      cueCardPoints: ['what it is and where', 'when you saw it', 'what it looks like', 'and explain why you found it impressive'],
      preparationTime: 60,
      speakingTime: 120,
    },
    { partNumber: 3, text: 'Why do you think countries spend money on space programmes?' },
    { partNumber: 3, text: 'Should international rules control activity in space?' },
    { partNumber: 3, text: 'How important is it to maintain old infrastructure?' },
    { partNumber: 3, text: 'Do you think modern buildings are better than older ones?' },
    { partNumber: 3, text: 'What kind of engineering projects will be most important in future?' },
  ],
};
