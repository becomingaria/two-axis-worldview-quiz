// Two Axis Worldview Quiz — page-specific logic.
// Shared scoring, chart-rendering, and export helpers live in common.js.

const QUIZ = [
  {
    id: "q1",
    axis: 1,
    title: "The Revolution",
    flavor:
      "An empire rules for centuries despite inequality and oppression. Then, within a single generation, revolutionary movements spread throughout the realm and overthrow the old order.",
    options: [
      {
        score: 2,
        text: "The empire fell when enough people stopped treating its authority as natural. A political order survives partly because people imagine it as legitimate; once that shared belief changed, the empire lost the foundation beneath its armies and laws.",
      },
      {
        score: -2,
        text: "The revolution became possible when taxation, food shortages, military defeats, and administrative decay made ordinary life intolerable. The new doctrines gave words to pressures that already demanded release.",
      },
      {
        score: 0,
        text: "The decisive change was organization. Discontent had existed for centuries, but new networks allowed scattered grievances to become coordinated action.",
      },
      {
        score: 1,
        text: "Conditions created an opening, but an opening is not a revolution. People had to frame injustice as changeable, persuade others, and accept the risks of acting on that belief.",
      },
      {
        score: -1,
        text: "The revolution succeeded because its leaders understood which demands the state could no longer meet and acted when its coercive capacity was weakest. Timing of their actions mattered more than purity of doctrine.",
      },
    ],
  },
  {
    id: "q2",
    axis: 1,
    title: "The Betrayal",
    flavor:
      "Two lifelong companions are trapped during a famine with food enough for only one. One steals the remaining food and abandons the other in order to survive.",
    options: [
      {
        score: 1,
        text: "The betrayal began long before the theft. Fear had become the person's governing value, and when the final crisis arrived, the action followed from the kind of self they had allowed themselves to become.",
      },
      {
        score: -2,
        text: "Starvation changes judgment, attention, and impulse. At a certain point the body's demand to survive overwhelms principles that seem absolute when basic needs are secure.",
      },
      {
        score: 0,
        text: "The act cannot be understood apart from the relationship itself: what promises existed, what resentments accumulated, and what each person believed they owed the other. “Hunger” alone is too general an explanation.",
      },
      {
        score: -1,
        text: "Desperation narrowed the field of choices but didn't completely erase them. The betrayal was made because of the famine, but another person, or this same person with stronger will, might still have refused to betray their companion.",
      },
      {
        score: 2,
        text: "Even at the edge of death, circumstance does not complete the choice. A person can decide that survival is not their highest value and, in doing so, determine who or what they are rather beyond what necessity would have made of them.",
      },
    ],
  },
  {
    id: "q3",
    axis: 1,
    title: "The Great Discovery",
    flavor:
      "A scholar discovers a principle that transforms civilization. Within decades it changes travel, warfare, medicine, and everyday life. Some claim that if this scholar had never lived, someone else would soon have made the same discovery.",
    options: [
      {
        score: -2,
        text: "The discovery became possible because generations of tools, measurements, and prior theories had accumulated. Once enough pieces existed, the remaining gap was inevitably small enough that someone was bound to cross it.",
      },
      {
        score: 2,
        text: "The scholar's achievement was asking a question their contemporaries would not. New knowledge often begins when someone refuses the boundaries of what an age thinks is possible. That spark inside the scholar drove them to the discovery.",
      },
      {
        score: 0,
        text: "The discovery emerged from a community of inquiry. Rivalries, correspondence, apprenticeships, failed experiments, and shared methods created a process no single mind fully controlled.",
      },
      {
        score: 1,
        text: "The age supplied the materials, but unusual insight accelerated history. Without this scholar the discovery might have come later, differently, or from another direction entirely.",
      },
      {
        score: -1,
        text: "The scholar succeeded because the practical problems of the age made this line of investigation useful. Need directed attention toward the questions most likely to matter.",
      },
    ],
  },
  {
    id: "q4",
    axis: 2,
    title: "The Returned Enemy",
    flavor:
      "A commander who once led brutal raids against your character's homeland defects from their army. They surrender valuable intelligence, accept imprisonment, and claim they no longer believe in the cause they served. Over the following months, their information repeatedly proves accurate.",
    options: [
      {
        score: 2,
        text: "Their change may be genuine. People can recognize what they have become, reject it, and build a different pattern of action; the risk of trusting them does not make that possibility unreal.",
      },
      {
        score: 1,
        text: "Their conduct deserves cautious credit. Trust should grow from what they continue to do, not from either their past crimes or their present words.",
      },
      {
        score: 0,
        text: "Whether they have truly changed matters less than the structure around them. Clear incentives, supervision, and consequences can make cooperation reliable even when motives remain uncertain.",
      },
      {
        score: -1,
        text: "Defection proves only that their old allegiance stopped serving them. Cooperation may last while their interests align with yours, but expecting a deeper transformation is unnecessary.",
      },
      {
        score: -2,
        text: "A person practiced in betrayal, violence, and self-preservation has already shown what they become when stakes are high. Temporary usefulness is not evidence that the underlying danger is gone.",
      },
    ],
  },
  {
    id: "q5",
    axis: 2,
    title: "The City After the Fire",
    flavor:
      "A great fire destroys much of a crowded city. Thousands lose homes and livelihoods. In the first weeks, however, strangers share food, guilds open their halls to refugees, and rival neighborhoods organize together to rebuild.",
    options: [
      {
        score: -1,
        text: "The solidarity is real, but emergency cooperation should not be mistaken for lasting change. Once scarcity, property, and old rivalries return, most of the city will return to their old behaviors.",
      },
      {
        score: 2,
        text: "The disaster has revealed capacities the city did not know it possessed. If people remember what they accomplished together, the rebuilt city may become better than the one that burned.",
      },
      {
        score: 0,
        text: "Crisis temporarily changes the incentives of cooperation. The lasting result will depend on whether new institutions preserve those incentives after the emergency ends.",
      },
      {
        score: 1,
        text: "The response is encouraging evidence about what people are capable of, though memory and habit will pull in both directions. Improvement is possible if the new relationships are deliberately maintained.",
      },
      {
        score: -2,
        text: "Catastrophe produces brief displays of unity because everyone is frightened and exposed. As soon as security returns, gratitude fades, advantages reassert themselves, and the old conflicts find new forms.",
      },
    ],
  },
  {
    id: "q6",
    axis: 2,
    title: "The Peace of Two Kings",
    flavor:
      "Two kingdoms have fought on and off for generations. Their new rulers negotiate a treaty, reopen the border, exchange hostages, and begin trading. For ten years there is no war, and children are now growing up who have never seen the neighboring kingdom as an enemy.",
    options: [
      {
        score: -1,
        text: "Ten peaceful years are useful, but they do not erase the forces that produced generations of war. A succession crisis, shortage, or an ambitious ruler can reactivate the old conflict quickly and send things directly back to how they were.",
      },
      {
        score: 2,
        text: "The treaty matters because peace can become ordinary. Once a generation has relationships, habits, and expectations built around cooperation, the future need not repeat the past.",
      },
      {
        score: 0,
        text: "Peace will last if the costs of breaking it remain higher than the gains from war. Trade, hostages, and shared interests matter more than whether the kingdoms' people have become morally better.",
      },
      {
        score: -2,
        text: "The old hatred is dormant. Prosperity makes reconciliation look profound; but serious hardship would remind both kingdoms how easily they can recover reasons to go to war with one another.",
      },
      {
        score: 1,
        text: "A decade without war is evidence that the pattern can change, but peace must be continually chosen and reinforced.",
      },
    ],
  },
];

function letterFor(index) {
  return String.fromCharCode(65 + index);
}

function buildForm() {
  const form = document.getElementById("quiz-form");
  const fragment = document.createDocumentFragment();

  QUIZ.forEach((question, qIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "question";

    const legend = document.createElement("legend");
    const kicker = document.createElement("span");
    kicker.className = "q-kicker";
    kicker.textContent = `Axis ${question.axis === 1 ? "I" : "II"} · Question ${qIndex + 1} of ${QUIZ.length}`;
    const heading = document.createElement("h2");
    heading.textContent = question.title;
    legend.appendChild(kicker);
    legend.appendChild(heading);
    fieldset.appendChild(legend);

    const flavor = document.createElement("p");
    flavor.className = "flavor";
    flavor.textContent = question.flavor;
    fieldset.appendChild(flavor);

    const options = document.createElement("div");
    options.className = "options";
    options.setAttribute("role", "radiogroup");
    options.setAttribute("aria-label", question.title);

    question.options.forEach((option, oIndex) => {
      const label = document.createElement("label");
      label.className = "option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.value = String(option.score);
      input.required = true;

      const glyph = document.createElement("span");
      glyph.className = "option-glyph";
      glyph.textContent = letterFor(oIndex);
      glyph.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;

      label.appendChild(input);
      label.appendChild(glyph);
      label.appendChild(text);
      options.appendChild(label);
    });

    fieldset.appendChild(options);
    fragment.appendChild(fieldset);
  });

  form.insertBefore(fragment, form.querySelector(".submit-row"));
}

function scoreQuiz(formData) {
  let axis1 = 0;
  let axis2 = 0;
  QUIZ.forEach((question) => {
    const value = Number(formData.get(question.id));
    if (question.axis === 1) axis1 += value;
    else axis2 += value;
  });
  return { axis1, axis2 };
}

function summaryText(characterName, axis1, axis2, archetype) {
  const name = characterName || "Your character";
  return [
    `${name}'s Worldview — Two Axis Quiz`,
    `Axis I (Ideas & Circumstance): ${formatScore(axis1)} — ${describeAxis(1, axis1)}`,
    `Axis II (Optimism & Pessimism): ${formatScore(axis2)} — ${describeAxis(2, axis2)}`,
    `Archetype: ${archetype.name}`,
  ].join("\n");
}

function init() {
  buildForm();

  const form = document.getElementById("quiz-form");
  const quizSection = document.getElementById("quiz-section");
  const resultsSection = document.getElementById("results-section");
  let lastRecord = null;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const missing = QUIZ.find((q) => !form.elements[q.id].value);
    if (missing) {
      const el = form.querySelector(`fieldset:nth-of-type(${QUIZ.indexOf(missing) + 1})`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const formData = new FormData(form);
    const characterName = (formData.get("character-name") || "").toString().trim();
    const rawScores = scoreQuiz(formData);
    const axis1 = clampForDisplay(rawScores.axis1);
    const axis2 = clampForDisplay(rawScores.axis2);
    const archetype = archetypeFor(axis1, axis2);

    document.getElementById("result-name").textContent = characterName || "Your character";
    document.getElementById("result-archetype-name").textContent = archetype.name;
    document.getElementById("result-archetype-blurb").textContent = archetype.blurb;
    document.getElementById("result-axis1").textContent = `${formatScore(axis1)} — ${describeAxis(1, axis1)}`;
    document.getElementById("result-axis2").textContent = `${formatScore(axis2)} — ${describeAxis(2, axis2)}`;

    document.getElementById("chart-container").innerHTML = buildSingleChartSVG(axis1, axis2, characterName);

    const copyButton = document.getElementById("copy-summary");
    copyButton.dataset.summary = summaryText(characterName, axis1, axis2, archetype);
    copyButton.textContent = "Copy Summary";

    lastRecord = buildResultRecord(characterName, rawScores.axis1, rawScores.axis2);

    quizSection.hidden = true;
    resultsSection.hidden = false;
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("retake-quiz").addEventListener("click", () => {
    form.reset();
    resultsSection.hidden = true;
    quizSection.hidden = false;
    quizSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("copy-summary").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const text = button.dataset.summary || "";
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied!";
      setTimeout(() => {
        button.textContent = "Copy Summary";
      }, 1800);
    } catch (err) {
      button.textContent = "Copy failed — select & copy manually";
    }
  });

  document.getElementById("save-results").addEventListener("click", () => {
    if (!lastRecord) return;
    downloadTextFile(`${safeFileName(lastRecord.characterName)}-worldview.txt`, JSON.stringify(lastRecord, null, 2));
  });

  document.getElementById("download-png").addEventListener("click", async (event) => {
    if (!lastRecord) return;
    const button = event.currentTarget;
    const svgEl = document.querySelector("#chart-container svg");
    const original = button.textContent;
    button.textContent = "Preparing…";
    try {
      await exportChartPNG({
        svgElement: svgEl,
        filename: `${safeFileName(lastRecord.characterName)}-worldview.png`,
        title: lastRecord.characterName,
        subtitle: lastRecord.archetype,
      });
    } catch (err) {
      button.textContent = "Download failed";
      setTimeout(() => {
        button.textContent = original;
      }, 1800);
      return;
    }
    button.textContent = original;
  });
}

document.addEventListener("DOMContentLoaded", init);
