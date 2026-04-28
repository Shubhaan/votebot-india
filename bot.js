const ui = {
  messagesContainer: document.getElementById('messagesContainer'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  menuToggle: document.getElementById('menuToggle'),
  sidebar: document.getElementById('sidebar'),
  langToggle: document.getElementById('langToggle'),
  themeToggle: document.getElementById('themeToggle'),
  quizPanel: document.getElementById('quizPanel'),
  quizQuestion: document.getElementById('quizQuestion'),
  quizOptions: document.getElementById('quizOptions'),
  quizFeedback: document.getElementById('quizFeedback'),
  quizNextBtn: document.getElementById('quizNextBtn'),
  quizProgress: document.getElementById('quizProgress')
};

let isHindi = false;

// Initialization
function init() {
  ui.sendBtn.addEventListener('click', handleSend);
  ui.userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  ui.menuToggle.addEventListener('click', () => {
    ui.sidebar.classList.toggle('open');
  });

  ui.langToggle.addEventListener('click', toggleLanguage);
  ui.themeToggle.addEventListener('click', toggleTheme);

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      ui.sidebar.classList.remove('open');
      handleQuickAction(action);
    });
  });

  // Load saved theme
  const savedTheme = localStorage.getItem('votebot-theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
    ui.themeToggle.innerText = '☀️';
  }

  showWelcomeMessage();
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  ui.themeToggle.innerText = isDark ? '☀️' : '🌙';
  ui.themeToggle.title = isDark ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  localStorage.setItem('votebot-theme', isDark ? 'dark' : 'light');
}

function toggleLanguage() {
  isHindi = !isHindi;
  document.body.classList.toggle('hindi-mode', isHindi);
  addBotMessage(isHindi 
    ? "नमस्ते! मैं वोटबॉट इंडिया हूँ। मैं चुनाव प्रक्रिया में आपकी मदद कैसे कर सकता हूँ? 🗳️" 
    : "Hello! I switched to English. How can I help you with the election process today? 🗳️");
}

function showWelcomeMessage() {
  const welcomeHTML = `
    <div class="welcome-screen">
      <div class="welcome-avatar">🗳️</div>
      <h1 class="welcome-title">Welcome to VoteBot India</h1>
      <p class="welcome-sub">Your friendly, non-partisan guide to Indian elections. I can help you register, find your booth, and understand your rights.</p>
      <div class="feature-chips">
        <span class="chip saffron-chip" onclick="handleQuickAction('eligibility')">Am I eligible?</span>
        <span class="chip navy-chip" onclick="handleQuickAction('register')">How to register</span>
        <span class="chip green-chip" onclick="handleQuickAction('booth')">Find my booth</span>
      </div>
    </div>
  `;
  ui.messagesContainer.innerHTML = welcomeHTML;
}

function addUserMessage(text) {
  const welcomeScreen = ui.messagesContainer.querySelector('.welcome-screen');
  if (welcomeScreen) welcomeScreen.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message user';
  msgDiv.innerHTML = `
    <div class="msg-avatar">👤</div>
    <div class="msg-bubble">${escapeHTML(text)}</div>
  `;
  ui.messagesContainer.appendChild(msgDiv);
  scrollToBottom();
}

function addBotMessage(html) {
  const welcomeScreen = ui.messagesContainer.querySelector('.welcome-screen');
  if (welcomeScreen) welcomeScreen.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = 'message bot';
  msgDiv.innerHTML = `
    <div class="msg-avatar">🗳️</div>
    <div class="msg-bubble">${html}</div>
  `;
  ui.messagesContainer.appendChild(msgDiv);
  scrollToBottom();
}

function scrollToBottom() {
  ui.messagesContainer.scrollTo({
    top: ui.messagesContainer.scrollHeight,
    behavior: 'smooth'
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Conversation State
let currentFlow = null;
let flowData = {};

function handleSend() {
  const text = ui.userInput.value.trim();
  if (!text) return;
  ui.userInput.value = '';
  
  addUserMessage(text);
  
  setTimeout(() => {
    processInput(text);
  }, 500);
}

function processInput(text) {
  const lowerText = text.toLowerCase();

  // Language check
  if (lowerText.includes('hindi') || lowerText.includes('हिंदी')) {
    isHindi = true;
    addBotMessage("नमस्ते! मैं अब से हिंदी में बात करूंगा। बताइए, मैं आपकी क्या मदद कर सकता हूँ? 🗳️");
    return;
  }
  if (lowerText.includes('english')) {
    isHindi = false;
    addBotMessage("Switched to English! How can I help you? 🗳️");
    return;
  }

  // Active flow handling
  if (currentFlow === 'eligibility_age') {
    const age = parseInt(text);
    if (isNaN(age)) {
      addBotMessage(isHindi ? "कृपया अपनी सही उम्र अंकों में बताएं। (जैसे: 20)" : "Please enter a valid age in numbers. (e.g., 20)");
      return;
    }
    flowData.age = age;
    currentFlow = 'eligibility_citizen';
    addBotMessage(isHindi ? "क्या आप एक भारतीय नागरिक हैं? (हाँ / नहीं)" : "Are you an Indian citizen? (Yes / No)");
    return;
  }
  
  if (currentFlow === 'eligibility_citizen') {
    const isCitizen = lowerText.includes('yes') || lowerText.includes('हाँ') || lowerText.includes('haan') || lowerText.includes('y');
    const age = flowData.age;
    currentFlow = null;
    flowData = {};

    if (isCitizen && age >= 18) {
      addBotMessage(isHindi ? 
        "✅ <strong>आप वोट देने के पात्र हैं!</strong><br>आप voters.eci.gov.in पर जाकर पंजीकरण कर सकते हैं। क्या आप जानना चाहते हैं कि पंजीकरण कैसे करें?" : 
        "✅ <strong>Great! You are eligible to vote.</strong><br>You can register at voters.eci.gov.in. Would you like to know how to register?");
    } else if (!isCitizen) {
      addBotMessage(isHindi ? 
        "❌ <strong>आप पात्र नहीं हैं।</strong><br>भारत में वोट देने के लिए आपको एक भारतीय नागरिक होना चाहिए।" : 
        "❌ <strong>Not eligible.</strong><br>You must be an Indian citizen to vote in India.");
    } else {
      addBotMessage(isHindi ? 
        `❌ <strong>आप अभी पात्र नहीं हैं।</strong><br>आपकी उम्र ${age} वर्ष है। मतदान के लिए न्यूनतम आयु 18 वर्ष है। 18 वर्ष के होने पर पंजीकरण करें!` : 
        `❌ <strong>Not eligible yet.</strong><br>You are ${age} years old. The minimum voting age is 18. Please register when you turn 18!`);
    }
    return;
  }

  if (currentFlow === 'checklist_q1') {
    flowData.registered = lowerText.includes('yes') || lowerText.includes('y') || lowerText.includes('हाँ');
    currentFlow = 'checklist_q2';
    addBotMessage(isHindi ? "क्या आपको अपने मतदान केंद्र (Polling Booth) का पता मालूम है? (हाँ/नहीं)" : "Do you know where your polling booth is? (Yes/No)");
    return;
  }
  
  if (currentFlow === 'checklist_q2') {
    flowData.boothKnown = lowerText.includes('yes') || lowerText.includes('y') || lowerText.includes('हाँ');
    currentFlow = 'checklist_q3';
    addBotMessage(isHindi ? "क्या आपके पास अपना वोटर आईडी (EPIC) या अन्य कोई मान्य आईडी है? (हाँ/नहीं)" : "Do you have your Voter ID or another valid ID ready? (Yes/No)");
    return;
  }

  if (currentFlow === 'checklist_q3') {
    flowData.hasId = lowerText.includes('yes') || lowerText.includes('y') || lowerText.includes('हाँ');
    currentFlow = null;
    generateChecklist();
    return;
  }

  // Intent matching
  if (lowerText.includes('eligible') || lowerText.includes('age') || lowerText.includes('पात्र')) {
    handleQuickAction('eligibility');
  } else if (lowerText.includes('register') || lowerText.includes('apply') || lowerText.includes('पंजीकरण')) {
    handleQuickAction('register');
  } else if (lowerText.includes('process') || lowerText.includes('how to vote') || lowerText.includes('प्रक्रिया')) {
    handleQuickAction('voting-day');
  } else if (lowerText.includes('timeline') || lowerText.includes('phases') || lowerText.includes('चरण')) {
    handleQuickAction('timeline');
  } else if (lowerText.includes('nota')) {
    addBotMessage(isHindi ? 
      "<strong>NOTA (None of the Above)</strong> का मतलब है 'इनमें से कोई नहीं'। यदि आपको कोई भी उम्मीदवार पसंद नहीं है, तो आप ईवीएम में NOTA का बटन दबा सकते हैं। यह सुनिश्चित करता है कि आपके वोट का दुरुपयोग न हो।" : 
      "<strong>NOTA</strong> stands for 'None of the Above'. If you don't find any candidate suitable, you can press the NOTA button on the EVM. It ensures your right to reject and prevents misuse of your vote.");
  } else if (lowerText.includes('evm')) {
    addBotMessage(isHindi ? 
      "<strong>EVM (Electronic Voting Machine)</strong> एक मशीन है जिसका उपयोग वोट डालने के लिए किया जाता है। इसमें उम्मीदवारों के नाम और चुनाव चिह्न होते हैं। इसके साथ VVPAT जुड़ा होता है जो आपके वोट की पुष्टि के लिए एक पर्ची निकालता है।" : 
      "<strong>EVM</strong> stands for Electronic Voting Machine. It's used to cast your vote electronically. It shows candidate names and symbols. It is accompanied by a VVPAT machine which prints a paper slip to verify your vote.");
  } else if (lowerText.includes('mcc') || lowerText.includes('model code') || lowerText.includes('आचार संहिता')) {
    addBotMessage(isHindi ? 
      "<strong>आदर्श आचार संहिता (Model Code of Conduct)</strong> चुनाव आयोग द्वारा बनाए गए नियम हैं जो राजनीतिक दलों और उम्मीदवारों को चुनाव के दौरान मानने होते हैं। यह निष्पक्ष चुनाव सुनिश्चित करता है और चुनाव की घोषणा के तुरंत बाद लागू हो जाता है।" : 
      "The <strong>Model Code of Conduct (MCC)</strong> is a set of guidelines issued by the Election Commission. It regulates the behavior of political parties and candidates to ensure free and fair elections. It comes into effect as soon as elections are announced.");
  } else if (lowerText.includes('photo') || lowerText.includes('camera') || lowerText.includes('सेल्फी') || lowerText.includes('selfie')) {
    addBotMessage(isHindi ? 
      "❌ <strong>नहीं!</strong> मतदान केंद्र के अंदर मोबाइल फोन ले जाना या फोटो/सेल्फी लेना सख्त मना है और यह गैरकानूनी है। आप वोट डालने के बाद बाहर आकर अपनी स्याही लगी उंगली के साथ सेल्फी ले सकते हैं!" : 
      "❌ <strong>No!</strong> Using mobile phones, taking photos, or clicking selfies inside the polling booth is strictly prohibited and illegal. You can take a selfie outside the booth displaying your inked finger after voting!");
  } else if (lowerText.includes('myth') || lowerText.includes('fact') || lowerText.includes('मिथक')) {
    handleQuickAction('myths');
  } else if (lowerText.includes('quiz') || lowerText.includes('test') || lowerText.includes('क्विज़')) {
    handleQuickAction('quiz');
  } else if (lowerText.includes('booth') || lowerText.includes('where to vote') || lowerText.includes('केंद्र')) {
    handleQuickAction('booth');
  } else if (lowerText.includes('rights') || lowerText.includes('rules') || lowerText.includes('अधिकार')) {
    handleQuickAction('rights');
  } else if (lowerText.includes('without voter id') || lowerText.includes('no voter id')) {
    addBotMessage(isHindi ? 
      "हाँ! अगर आपका नाम वोटर लिस्ट में है लेकिन आपके पास वोटर आईडी (EPIC) नहीं है, तो आप आधार कार्ड, पैन कार्ड, पासपोर्ट या ड्राइविंग लाइसेंस जैसे 12 अन्य मान्यता प्राप्त पहचान पत्रों का उपयोग करके वोट कर सकते हैं।" : 
      "Yes! If your name is on the voter list but you don't have your Voter ID (EPIC), you can still vote using 12 other alternate IDs like Aadhaar Card, PAN Card, Passport, or Driving License.");
  } else {
    addBotMessage(isHindi ? 
      "मुझे क्षमा करें, मुझे ठीक से समझ नहीं आया। आप पंजीकरण, चुनाव प्रक्रिया, अपने मतदान केंद्र, या अपने अधिकारों के बारे में पूछ सकते हैं। सटीक जानकारी के लिए आप eci.gov.in भी देख सकते हैं। 🗳️" : 
      "I'm sorry, I didn't quite catch that. You can ask me about voter registration, the voting process, finding your booth, or your rights. You can also visit eci.gov.in for the most accurate information. 🗳️");
  }
}

function handleQuickAction(action) {
  if (action === 'hindi') {
    toggleLanguage();
    return;
  }

  if (action === 'eligibility') {
    currentFlow = 'eligibility_age';
    addBotMessage(isHindi ? "चलिए आपकी पात्रता जांचते हैं। आपकी उम्र क्या है?" : "Let's check your eligibility! First, how old are you?");
  } 
  else if (action === 'register') {
    addBotMessage(isHindi ? `
      <strong>पंजीकरण कैसे करें:</strong><br>
      <div class="step"><span class="step-num">1</span> <div><b>voters.eci.gov.in</b> पर जाएं या Voter Helpline App डाउनलोड करें।</div></div>
      <div class="step"><span class="step-num">2</span> <div>नया पंजीकरण करने के लिए <b>Form 6</b> भरें।</div></div>
      <div class="step"><span class="step-num">3</span> <div>अपने दस्तावेज़ अपलोड करें: रंगीन फोटो, आयु प्रमाण पत्र (आधार/पैन/जन्म प्रमाण पत्र), और पता प्रमाण पत्र।</div></div>
      <div class="step"><span class="step-num">4</span> <div>फॉर्म जमा करें और रेफरेंस नंबर से स्टेटस ट्रैक करें।</div></div>
      <br><em>ध्यान दें: चुनाव से कुछ हफ़्ते पहले पंजीकरण बंद हो जाता है, इसलिए जल्दी करें!</em>
    ` : `
      <strong>How to Register to Vote:</strong><br>
      <div class="step"><span class="step-num">1</span> <div>Visit <b>voters.eci.gov.in</b> or download the Voter Helpline App.</div></div>
      <div class="step"><span class="step-num">2</span> <div>Fill out <b>Form 6</b> for new voter registration.</div></div>
      <div class="step"><span class="step-num">3</span> <div>Upload required documents: a recent passport photo, Age Proof (Aadhaar/PAN/Birth Certificate), and Address Proof.</div></div>
      <div class="step"><span class="step-num">4</span> <div>Submit and keep your reference ID to track your status.</div></div>
      <br><em>Tip: Don't wait until the last minute! Registration closes a few weeks before election day.</em>
    `);
  }
  else if (action === 'voting-day') {
    addBotMessage(isHindi ? `
      <strong>मतदान के दिन की प्रक्रिया:</strong><br>
      <div class="step"><span class="step-num">1</span> <div><b>केंद्र पर जाएं:</b> अपने निर्धारित मतदान केंद्र पर जाएं।</div></div>
      <div class="step"><span class="step-num">2</span> <div><b>आईडी सत्यापन:</b> पोलिंग अधिकारी आपकी आईडी और वोटर लिस्ट में नाम जांचेंगे।</div></div>
      <div class="step"><span class="step-num">3</span> <div><b>स्याही:</b> दूसरा अधिकारी आपकी उंगली पर अमिट स्याही लगाएगा और रजिस्टर पर हस्ताक्षर लेगा।</div></div>
      <div class="step"><span class="step-num">4</span> <div><b>वोट करें:</b> EVM मशीन पर अपने पसंद के उम्मीदवार के सामने वाला बटन दबाएं।</div></div>
      <div class="step"><span class="step-num">5</span> <div><b>पुष्टि करें:</b> VVPAT मशीन से निकलने वाली पर्ची को 7 सेकंड तक देखकर पुष्टि करें।</div></div>
    ` : `
      <strong>Voting Day Process:</strong><br>
      <div class="step"><span class="step-num">1</span> <div><b>Travel to Booth:</b> Go to your designated polling booth.</div></div>
      <div class="step"><span class="step-num">2</span> <div><b>ID Verification:</b> The First Polling Officer checks your name in the list and your ID.</div></div>
      <div class="step"><span class="step-num">3</span> <div><b>Ink Mark:</b> The Second Officer marks your left index finger with indelible ink and takes your signature.</div></div>
      <div class="step"><span class="step-num">4</span> <div><b>Cast Vote:</b> Proceed to the voting compartment. Press the blue button on the EVM against your chosen candidate.</div></div>
      <div class="step"><span class="step-num">5</span> <div><b>Verify:</b> Look at the VVPAT machine. A slip will appear for 7 seconds to confirm your vote.</div></div>
    `);
  }
  else if (action === 'timeline') {
    addBotMessage(isHindi ? `
      <strong>चुनाव के चरण:</strong><br>
      📢 <b>घोषणा:</b> चुनाव आयोग तारीखों का ऐलान करता है। आचार संहिता लागू होती है।<br>
      🗓️ <b>प्रचार:</b> राजनीतिक दल अपनी रैलियां और प्रचार करते हैं।<br>
      🤫 <b>मौन अवधि:</b> मतदान से 48 घंटे पहले सभी प्रचार बंद कर दिए जाते हैं।<br>
      🗳️ <b>मतदान:</b> नागरिक अपना वोट डालते हैं।<br>
      📊 <b>गिनती और नतीजे:</b> कड़ी सुरक्षा के बीच ईवीएम खोली जाती हैं और नतीजे घोषित होते हैं।
    ` : `
      <strong>Election Timeline Explained:</strong><br>
      📢 <b>Announcement:</b> The ECI announces dates. Model Code of Conduct (MCC) kicks in.<br>
      🗓️ <b>Campaign Period:</b> Candidates hold rallies and campaign.<br>
      🤫 <b>Silence Period:</b> 48 hours before polling, all public campaigning must stop.<br>
      🗳️ <b>Voting Day:</b> Citizens cast their votes at polling booths.<br>
      📊 <b>Counting & Results:</b> EVMs are opened under strict security, votes are counted, and winners are declared.
    `);
  }
  else if (action === 'rights') {
    addBotMessage(isHindi ? `
      <strong>आपके अधिकार और नियम:</strong><br>
      ⚖️ <b>अनुच्छेद 326:</b> 18 वर्ष या उससे अधिक उम्र के हर नागरिक को वोट देने का मौलिक अधिकार है।<br>
      🛑 <b>क्या मना है:</b> रिश्वत लेना, डराना-धमकाना, या मतदान केंद्र पर कब्जा करना सख्त अपराध है।<br>
      ⏱️ <b>समय:</b> यदि आप मतदान के समय के खत्म होने तक लाइन में लग जाते हैं, तो आपको वोट डालने का अधिकार है।
    ` : `
      <strong>Your Rights & Rules:</strong><br>
      ⚖️ <b>Article 326:</b> Voting is a constitutional right for every citizen aged 18 and above.<br>
      🛑 <b>Prohibited Acts:</b> Bribery, intimidation, fake voting, and booth capturing are strict criminal offenses.<br>
      ⏱️ <b>Queue Rule:</b> If you are standing in the queue before the official closing time of the poll, you have the right to cast your vote, no matter how long it takes.
    `);
  }
  else if (action === 'myths') {
    const myths = [
      {
        m: "I can vote twice if I have two Voter IDs.",
        f: "False! Each citizen gets exactly ONE vote. Multiple registrations are illegal, and the ink mark ensures you can't vote twice.",
        hm: "अगर मेरे पास दो वोटर आईडी हैं तो मैं दो बार वोट कर सकता हूं।",
        hf: "गलत! हर नागरिक का केवल एक वोट होता है। स्याही का निशान सुनिश्चित करता है कि आप दोबारा वोट न कर सकें।"
      },
      {
        m: "I can't vote if I lose my Voter ID card.",
        f: "False! If your name is on the electoral roll, you can use 12 other IDs (like Aadhaar, PAN, Passport) to vote.",
        hm: "वोटर आईडी खो जाने पर मैं वोट नहीं कर सकता।",
        hf: "गलत! यदि आपका नाम वोटर लिस्ट में है, तो आप आधार, पैन या पासपोर्ट जैसी 12 अन्य आईडी का उपयोग कर सकते हैं।"
      },
      {
        m: "EVMs can be easily hacked via WiFi.",
        f: "False! EVMs are standalone machines with no radio/WiFi modules. They cannot connect to any network.",
        hm: "ईवीएम को वाईफाई के जरिए आसानी से हैक किया जा सकता है।",
        hf: "गलत! ईवीएम स्टैंडअलोन मशीनें हैं जिनमें कोई इंटरनेट या वाईफाई नहीं होता है।"
      }
    ];
    const rand = myths[Math.floor(Math.random() * myths.length)];
    
    addBotMessage(isHindi ? `
      <div class="myth-card myth">❌ <b>मिथक:</b> ${rand.hm}</div>
      <div class="myth-card fact">✅ <b>तथ्य:</b> ${rand.hf}</div>
      <em>और जानना चाहते हैं? फिर से 'Myth vs Fact' पर क्लिक करें!</em>
    ` : `
      <div class="myth-card myth">❌ <b>Myth:</b> ${rand.m}</div>
      <div class="myth-card fact">✅ <b>Fact:</b> ${rand.f}</div>
      <em>Want another one? Ask for more myths!</em>
    `);
  }
  else if (action === 'booth') {
    addBotMessage(isHindi ? `
      <strong>अपना मतदान केंद्र कैसे खोजें:</strong><br>
      आप <b>electoralsearch.eci.gov.in</b> पर जाकर अपना नाम या EPIC नंबर (वोटर आईडी नंबर) डालकर अपना मतदान केंद्र खोज सकते हैं।<br>
      आप <b>Voter Helpline App</b> का भी उपयोग कर सकते हैं।
    ` : `
      <strong>How to find your Polling Booth:</strong><br>
      Visit <b><a href="https://electoralsearch.eci.gov.in" target="_blank">electoralsearch.eci.gov.in</a></b>.<br>
      You can search for your booth using your EPIC number (Voter ID number) or your personal details.<br>
      Alternatively, you can use the <b>Voter Helpline App</b>.
    `);
  }
  else if (action === 'checklist') {
    currentFlow = 'checklist_q1';
    addBotMessage(isHindi ? "चलिए आपकी चेकलिस्ट बनाते हैं। क्या आप एक पंजीकृत मतदाता हैं? (हाँ/नहीं)" : "Let's build your personalized checklist. First, are you a registered voter? (Yes/No)");
  }
  else if (action === 'quiz') {
    startQuiz();
  }
}

function generateChecklist() {
  let list = isHindi ? "<strong>आपकी वोटिंग चेकलिस्ट:</strong><br>" : "<strong>Your Voting Day Checklist:</strong><br>";
  
  if (!flowData.registered) {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle" style="border-color:red; color:red;">❌</div> <div><b>पंजीकरण करें:</b> आपने अभी पंजीकरण नहीं किया है। voters.eci.gov.in पर जाएं।</div></div>` :
      `<div class="checklist-item"><div class="check-circle" style="border-color:red; color:red;">❌</div> <div><b>Register:</b> You need to register first at voters.eci.gov.in.</div></div>`;
  } else {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>पंजीकरण:</b> आप पंजीकृत हैं।</div></div>` :
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>Registered:</b> You are on the voter list.</div></div>`;
  }

  if (!flowData.boothKnown) {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle" style="border-color:orange; color:orange;">!</div> <div><b>केंद्र खोजें:</b> electoralsearch.eci.gov.in पर अपना मतदान केंद्र खोजें।</div></div>` :
      `<div class="checklist-item"><div class="check-circle" style="border-color:orange; color:orange;">!</div> <div><b>Find Booth:</b> Find your polling booth at electoralsearch.eci.gov.in.</div></div>`;
  } else {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>मतदान केंद्र:</b> आपको अपना केंद्र पता है।</div></div>` :
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>Booth Known:</b> You know where to go.</div></div>`;
  }

  if (!flowData.hasId) {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle" style="border-color:red; color:red;">❌</div> <div><b>आईडी:</b> अपना वोटर आईडी या आधार/पैन तैयार रखें!</div></div>` :
      `<div class="checklist-item"><div class="check-circle" style="border-color:red; color:red;">❌</div> <div><b>ID Ready:</b> Prepare your Voter ID or Aadhaar/PAN before leaving!</div></div>`;
  } else {
    list += isHindi ? 
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>आईडी:</b> आपकी आईडी तैयार है।</div></div>` :
      `<div class="checklist-item"><div class="check-circle">✓</div> <div><b>ID Ready:</b> Your ID is ready.</div></div>`;
  }

  list += isHindi ? "<br><em>याद रखें: फोन अंदर ले जाना मना है!</em>" : "<br><em>Remember: No mobile phones inside the booth!</em>";
  addBotMessage(list);
}

// ── QUIZ LOGIC ──
const quizDataEn = [
  {
    q: "What is the minimum voting age in India?",
    opts: ["16", "18", "21", "25"],
    ans: 1,
    exp: "The 61st Constitutional Amendment Act (1988) lowered the voting age from 21 to 18 years."
  },
  {
    q: "What does NOTA stand for?",
    opts: ["None of the Above", "No Other True Answer", "Name On The Application", "None Of The Action"],
    ans: 0,
    exp: "NOTA allows voters to reject all candidates in their constituency if they find none suitable."
  },
  {
    q: "Which form is used for new voter registration?",
    opts: ["Form 4", "Form 6", "Form 8", "Form 10"],
    ans: 1,
    exp: "Form 6 is the application form for new voters to get their names included in the electoral roll."
  },
  {
    q: "Can you vote without a Voter ID (EPIC) card?",
    opts: ["No, it's mandatory", "Yes, with 12 other alternate IDs", "Yes, just with a photo", "Only if the Booth Level Officer permits"],
    ans: 1,
    exp: "If your name is on the electoral roll, you can vote using Aadhaar, PAN, Passport, Driving License, etc."
  },
  {
    q: "What does VVPAT do?",
    opts: ["Registers candidates", "Prints a paper slip verifying your vote", "Counts total votes", "Checks your ID"],
    ans: 1,
    exp: "Voter Verifiable Paper Audit Trail (VVPAT) prints a slip showing the candidate you voted for, visible for 7 seconds."
  }
];

const quizDataHi = [
  {
    q: "भारत में मतदान की न्यूनतम आयु क्या है?",
    opts: ["16", "18", "21", "25"],
    ans: 1,
    exp: "61वें संविधान संशोधन (1988) द्वारा मतदान की आयु 21 से घटाकर 18 वर्ष कर दी गई।"
  },
  {
    q: "NOTA का क्या अर्थ है?",
    opts: ["None of the Above (इनमें से कोई नहीं)", "No Other True Answer", "Name On The Application", "None Of The Action"],
    ans: 0,
    exp: "NOTA मतदाताओं को किसी भी उम्मीदवार को वोट न देने का विकल्प देता है।"
  },
  {
    q: "नए मतदाता पंजीकरण के लिए कौन सा फॉर्म भरा जाता है?",
    opts: ["फॉर्म 4", "फॉर्म 6", "फॉर्म 8", "फॉर्म 10"],
    ans: 1,
    exp: "फॉर्म 6 का उपयोग मतदाता सूची में पहली बार नाम जुड़वाने के लिए किया जाता है।"
  },
  {
    q: "क्या आप वोटर आईडी (EPIC) के बिना वोट कर सकते हैं?",
    opts: ["नहीं, यह अनिवार्य है", "हाँ, 12 अन्य आईडी के साथ", "हाँ, सिर्फ एक फोटो के साथ", "केवल अधिकारी की अनुमति पर"],
    ans: 1,
    exp: "यदि आपका नाम मतदाता सूची में है, तो आप आधार, पैन, पासपोर्ट आदि का उपयोग कर सकते हैं।"
  },
  {
    q: "VVPAT का क्या काम है?",
    opts: ["उम्मीदवारों का पंजीकरण", "वोट की पुष्टि के लिए पर्ची छापना", "वोटों की गिनती", "आईडी जाँचना"],
    ans: 1,
    exp: "VVPAT एक पर्ची निकालता है (7 सेकंड के लिए) जिससे पुष्टि होती है कि आपका वोट सही पड़ा है।"
  }
];

let currentQuiz = 0;
let score = 0;
let quizQuestions = [];

function startQuiz() {
  quizQuestions = isHindi ? quizDataHi : quizDataEn;
  currentQuiz = 0;
  score = 0;
  ui.quizPanel.style.display = 'block';
  ui.quizPanel.scrollIntoView({ behavior: 'smooth' });
  loadQuizQuestion();
  addBotMessage(isHindi ? "चलिए देखते हैं कि आप चुनाव के बारे में कितना जानते हैं! नीचे दिए गए पैनल में उत्तर दें।" : "Let's see how much you know about elections! Answer in the panel below.");
}

function loadQuizQuestion() {
  const q = quizQuestions[currentQuiz];
  ui.quizProgress.innerText = isHindi ? `प्रश्न ${currentQuiz + 1} / 5` : `Question ${currentQuiz + 1} of 5`;
  ui.quizQuestion.innerText = q.q;
  ui.quizFeedback.className = 'quiz-feedback';
  ui.quizNextBtn.style.display = 'none';
  
  ui.quizOptions.innerHTML = '';
  q.opts.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.innerText = opt;
    btn.onclick = () => handleQuizAnswer(idx, btn);
    ui.quizOptions.appendChild(btn);
  });
}

function handleQuizAnswer(idx, btnElement) {
  const q = quizQuestions[currentQuiz];
  const btns = ui.quizOptions.querySelectorAll('.quiz-opt-btn');
  btns.forEach(b => b.disabled = true); // disable all

  if (idx === q.ans) {
    score++;
    btnElement.classList.add('correct');
    ui.quizFeedback.innerHTML = `✅ <b>${isHindi ? 'सही!' : 'Correct!'}</b> ${q.exp}`;
  } else {
    btnElement.classList.add('wrong');
    btns[q.ans].classList.add('correct'); // Highlight right answer
    ui.quizFeedback.innerHTML = `❌ <b>${isHindi ? 'गलत!' : 'Incorrect!'}</b> ${q.exp}`;
  }

  ui.quizFeedback.classList.add('visible');
  
  if (currentQuiz < quizQuestions.length - 1) {
    ui.quizNextBtn.innerText = isHindi ? "अगला प्रश्न →" : "Next Question →";
    ui.quizNextBtn.onclick = () => {
      currentQuiz++;
      loadQuizQuestion();
    };
  } else {
    ui.quizNextBtn.innerText = isHindi ? "परिणाम देखें" : "See Results";
    ui.quizNextBtn.onclick = showQuizResults;
  }
  ui.quizNextBtn.style.display = 'block';
}

function showQuizResults() {
  ui.quizPanel.style.display = 'none';
  
  let msg = `
    <div class="score-card">
      <div class="score-circle">${score}/5</div>
      <strong>${isHindi ? 'क्विज़ पूरा हुआ!' : 'Quiz Completed!'}</strong><br>
  `;

  if (score === 5) {
    msg += isHindi ? "अद्भुत! आप चुनाव प्रक्रिया के विशेषज्ञ हैं! 🏆" : "Amazing! You are an election expert! 🏆";
  } else if (score >= 3) {
    msg += isHindi ? "बहुत बढ़िया! आपको अच्छी जानकारी है। 👏" : "Great job! You have good knowledge of the process. 👏";
  } else {
    msg += isHindi ? "अच्छा प्रयास! मेरे साथ चुनाव के बारे में और जानें! 📚" : "Good try! Keep asking me questions to learn more! 📚";
  }
  
  msg += `</div>`;
  addBotMessage(msg);
}

// Start
init();
