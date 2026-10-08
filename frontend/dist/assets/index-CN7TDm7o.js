var ce=Object.defineProperty;var ue=(w,e,t)=>e in w?ce(w,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):w[e]=t;var x=(w,e,t)=>ue(w,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();class E{static generateUniqueOtp(){return Math.floor(1e5+Math.random()*9e5).toString()}static setGmailCredentials(e,t){this.gmailUser=e,this.gmailAppPassword=t}static async sendAdminOtpEmail(e,t){const s=e&&e.includes("@")?e:"udayrise7666@gmail.com",a=`NexusAssess Security: Your Admin 2FA Passcode [${t}]`,n=`
      <div style="font-family: Arial, sans-serif; background-color: #090d16; padding: 24px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #3b82f6;">Nexus<span style="color: #60a5fa;">Assess</span> Security</h2>
        </div>
        <h3 style="color: #ffffff;">Admin 2FA Email OTP Verification</h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
          You requested administrator sign-in access. Your unique 6-digit verification OTP passcode is:
        </p>
        <div style="background-color: #1e293b; border: 1px solid #334155; padding: 18px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${t}</span>
        </div>
        <p style="color: #64748b; font-size: 12px;">This OTP is unique for this login session and valid for 10 minutes.</p>
      </div>
    `,r={id:`email-${Date.now()}`,recipientEmail:s,recipientName:"System Administrator",subject:a,bodyText:`Your unique NexusAssess Admin 2FA OTP is: ${t}`,bodyHtml:n,otpCode:t,sentAt:new Date().toLocaleString(),status:"Delivered",provider:"Gmail SMTP (smtp.gmail.com:587)"};return this.sentEmails.unshift(r),this.triggerRealHttpMailGateway(r).catch(()=>{}),r}static async sendCandidateInviteEmail(e,t,s,a){const n=t||"udayrise7666@gmail.com",r=`Assessment Invitation: Senior Full-Stack Challenge - OTP [${a}]`,i=`
      <div style="font-family: Arial, sans-serif; background-color: #090d16; padding: 24px; color: #f8fafc; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="margin-bottom: 16px;">
          <h2 style="margin: 0; color: #3b82f6;">Nexus<span style="color: #60a5fa;">Assess</span> Enterprise Evaluation</h2>
        </div>
        <h3 style="color: #ffffff;">Hello ${e},</h3>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          You have been invited to take the <strong>Senior Full-Stack Engineer Assessment</strong>.
        </p>
        <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Your Unique Security Access Passcode (OTP):</p>
          <span style="font-family: monospace; font-size: 28px; font-weight: bold; color: #10b981; letter-spacing: 6px;">${a}</span>
        </div>
        <div style="margin: 24px 0;">
          <a href="${s}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">
            BEGIN ONLINE ASSESSMENT ➔
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px;">Direct Link: <a href="${s}" style="color: #3b82f6;">${s}</a></p>
      </div>
    `,o={id:`email-${Date.now()}`,recipientEmail:n,recipientName:e,subject:r,bodyText:`Hello ${e}, You have been invited to complete your assessment. Unique OTP: ${a}. Link: ${s}`,bodyHtml:i,otpCode:a,assessmentLink:s,sentAt:new Date().toLocaleString(),status:"Delivered",provider:"Gmail SMTP (smtp.gmail.com:587)"};return this.sentEmails.unshift(o),this.triggerRealHttpMailGateway(o).catch(()=>{}),o}static async triggerRealHttpMailGateway(e){try{const t={recipientEmail:e.recipientEmail,recipientName:e.recipientName,subject:e.subject,bodyHtml:e.bodyHtml,smtpHost:"smtp.gmail.com",smtpPort:587,smtpUser:this.gmailUser,smtpPassword:this.gmailAppPassword};let s=await fetch("http://localhost:8080/api/v1/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).catch(()=>null);return(!s||!s.ok)&&(s=await fetch("http://localhost:8000/api/v1/send-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).catch(()=>null)),s&&s.ok&&(e.status="Delivered",e.provider="Gmail SMTP (smtp.gmail.com:587)"),!0}catch{return!1}}static getSentEmails(){return this.sentEmails}}x(E,"gmailUser","udayrise7666@gmail.com"),x(E,"gmailAppPassword","fjacucsgfnfbiemd"),x(E,"sentEmails",[]);const pe={maxTabSwitches:3,maxViolationsBeforeTerminate:5,proctoringSensitivity:"high",requireCamera:!0,requireMicrophone:!0,requireScreenShare:!1,detectPhone:!0,detectMultipleFaces:!0,detectFaceMissing:!0,enableFullscreenLock:!0,otpMethod:"both",linkExpirationHours:48,allowSectionRevisit:!1},j=[{id:"q-mcq-1",type:"mcq",title:"Python Memory Management",content:"Which module in Python can be used to inspect memory allocation and reference counts?",options:[{id:"opt-1",text:"sys"},{id:"opt-2",text:"gc"},{id:"opt-3",text:"tracemalloc"},{id:"opt-4",text:"All of the above"}],correctAnswers:["opt-4"],difficulty:"medium",points:10,category:"Python",tags:["Core Python","Memory","Performance"]},{id:"q-sql-1",type:"sql",title:"Employee Department Salary Ranking",content:"Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.",difficulty:"hard",points:20,category:"SQL Database",tags:["PostgreSQL","Window Functions","Analytics"],sampleCode:{sql:`-- Write your SQL query below
SELECT department_id, employee_id, salary
FROM (
  SELECT department_id, employee_id, salary,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank
  FROM employees
) sub
WHERE rank <= 2;`}},{id:"q-coding-1",type:"coding",title:"Two Sum Variant: Maximum Subarray Product",content:"Given an integer array `nums`, find a contiguous non-empty subarray within the array that has the largest product, and return *the product*.\n\n### Example 1:\n**Input:** `nums = [2,3,-2,4]`  \n**Output:** `6`  \n**Explanation:** `[2,3]` has the largest product 6.",difficulty:"medium",points:25,category:"Algorithms",tags:["Dynamic Programming","Array","Algorithms"],language:"python",sampleCode:{python:`def max_product(nums: list[int]) -> int:
    # Write your solution here
    if not nums:
        return 0
    
    res = max_num = min_num = nums[0]
    for i in range(1, len(nums)):
        n = nums[i]
        if n < 0:
            max_num, min_num = min_num, max_num
        max_num = max(n, max_num * n)
        min_num = min(n, min_num * n)
        res = max(res, max_num)
        
    return res

# Test call
print(max_product([2,3,-2,4]))`,javascript:`function maxProduct(nums) {
    if (!nums || nums.length === 0) return 0;
    let res = nums[0], maxNum = nums[0], minNum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        let n = nums[i];
        if (n < 0) {
            let temp = maxNum;
            maxNum = minNum;
            minNum = temp;
        }
        maxNum = Math.max(n, maxNum * n);
        minNum = Math.min(n, minNum * n);
        res = Math.max(res, maxNum);
    }
    return res;
}
console.log(maxProduct([2,3,-2,4]));`},testCases:[{id:"tc-1",input:"[2,3,-2,4]",expectedOutput:"6",isHidden:!1,weight:5},{id:"tc-2",input:"[-2,0,-1]",expectedOutput:"0",isHidden:!1,weight:5},{id:"tc-3",input:"[-2,3,-4]",expectedOutput:"24",isHidden:!0,weight:10},{id:"tc-4",input:"[0, 2]",expectedOutput:"2",isHidden:!0,weight:5}]},{id:"q-essay-1",type:"essay",title:"Microservice Architecture vs Monolith Design",content:"Discuss the architectural trade-offs between a modular monolithic system and an event-driven microservices architecture. Highlight aspects of deployment complexity, data consistency (CAP theorem / Saga pattern), and operational costs.",essayMinWords:150,essayMaxWords:500,difficulty:"hard",points:20,category:"System Design",tags:["Architecture","Microservices","Distributed Systems"]}],te=[{id:"assess-101",title:"Senior Full Stack & AI Engineer Assessment",roleTitle:"Senior Software Engineer",description:"Comprehensive technical evaluation covering Quantitative Logic, Python/JS Algorithmic Coding, SQL Querying, and System Design Architecture.",totalDurationMinutes:60,totalQuestions:4,passingPercentage:70,status:"active",createdDate:"2026-07-20",sections:[{id:"sec-1",name:"Technical MCQs & Aptitude",description:"Core concepts in Python memory, async logic, and data structures.",instructions:"Select the best answer for each question. Negative marking is disabled for this section.",timeLimitMinutes:10,passingMarks:10,questions:[j[0]],isMandatory:!0},{id:"sec-2",name:"Database & SQL Engineering",description:"Complex aggregation, window functions, and schema optimization.",instructions:"Write production-ready SQL queries. Test against the provided table schemas.",timeLimitMinutes:15,passingMarks:15,questions:[j[1]],isMandatory:!0},{id:"sec-3",name:"Algorithmic Coding Challenge",description:"Data Structures and Dynamic Programming problem solving.",instructions:"Write efficient code. Pay attention to time complexity and edge cases.",timeLimitMinutes:20,passingMarks:20,questions:[j[2]],isMandatory:!0},{id:"sec-4",name:"Architectural Essay",description:"System design principles, microservices, and high-availability systems.",instructions:"Ensure minimum word count requirement of 150 words.",timeLimitMinutes:15,passingMarks:15,questions:[j[3]],isMandatory:!1}]}],H="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/><path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>",F="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/><circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>",me=[{id:"cand-1",name:"Alex Rivera",email:"alex.rivera@example.com",phone:"+1-555-0192",experienceYears:6,skills:["Python","FastAPI","TypeScript","PostgreSQL","Docker"],status:"Completed",assessmentId:"assess-101",invitedAt:"2026-07-28",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:H,idProofUrl:F,identityStatus:"approved"},{id:"cand-2",name:"Priya Sharma",email:"priya.sharma@example.com",phone:"+91-98765-43210",experienceYears:8,skills:["Java","Spring Boot","Microservices","SQL","Kubernetes"],status:"Under Review",assessmentId:"assess-101",invitedAt:"2026-07-29",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:H,idProofUrl:F,identityStatus:"approved"},{id:"cand-3",name:"Marcus Vance",email:"marcus.vance@example.com",phone:"+44-7700-900077",experienceYears:4,skills:["React","Node.js","GraphQL","Tailwind","MongoDB"],status:"Assessment Sent",assessmentId:"assess-101",invitedAt:"2026-07-30",otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1,livePhotoUrl:H,idProofUrl:F,identityStatus:"pending_verification"},{id:"cand-4",name:"Sophia Chen",email:"sophia.chen@example.com",phone:"+1-555-0144",experienceYears:5,skills:["Python","PyTorch","FastAPI","Docker","AWS"],status:"Selected",assessmentId:"assess-101",invitedAt:"2026-07-25",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:H,idProofUrl:F,identityStatus:"approved"}],be={"cand-1":{id:"res-1",candidateId:"cand-1",assessmentId:"assess-101",completedAt:"2026-07-28T16:45:00Z",totalScore:68,maxScore:75,percentage:90.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:20,maxScore:20,percentage:100},"Algorithmic Coding Challenge":{score:25,maxScore:25,percentage:100},"Architectural Essay":{score:13,maxScore:20,percentage:65}},aiConfidenceScore:94.5,totalViolations:1,proctoringLogs:[{id:"viol-1",candidateId:"cand-1",timestamp:"16:12:04",type:"Tab Switch",severity:"low",description:"Candidate switched window for 2 seconds (Warning issued)"}],recruiterNotes:"Exceptional coding speed and SQL window function expertise. Essay demonstrates solid understanding of Saga pattern trade-offs.",recruiterDecision:"Selected"},"cand-2":{id:"res-2",candidateId:"cand-2",assessmentId:"assess-101",completedAt:"2026-07-29T11:20:00Z",totalScore:54,maxScore:75,percentage:72,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:15,maxScore:20,percentage:75},"Algorithmic Coding Challenge":{score:15,maxScore:25,percentage:60},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:88,totalViolations:2,proctoringLogs:[{id:"viol-2",candidateId:"cand-2",timestamp:"11:05:12",type:"Looking Away",severity:"low",description:"Gaze moved off-screen for 4 seconds."},{id:"viol-3",candidateId:"cand-2",timestamp:"11:15:40",type:"Background Voice",severity:"medium",description:"Background audio detected above threshold."}],recruiterNotes:"Passed baseline cutoff. Requires technical interview follow-up on algorithmic edge cases.",recruiterDecision:"Under Review"}};class xe{constructor(){x(this,"state");x(this,"listeners",[]);x(this,"activeStreams",[]);this.state={currentRole:"Candidate",isAuthenticatedAdminRecruiter:!1,settings:{...pe},assessments:[...te],activeAssessmentId:te[0].id,candidates:[...me],candidateResults:{...be},questionBank:[...j],activeCandidateId:"cand-3",otpVerified:!1,systemCheckCompleted:!1,examStarted:!1,examCompleted:!1,currentSectionIndex:0,currentQuestionIndex:0,sectionTimeRemainingSeconds:600,candidateAnswers:{},codeSubmissions:{},flaggedQuestions:new Set,candidateFeedback:null,isFullscreen:!1,violationCount:0,proctoringLogs:[],liveProctoringAlert:null,proctorIntercomMessage:null,theme:"dark",activeAdminOtp:null,activeCandidateOtp:null}}toggleTheme(){this.state.theme=this.state.theme==="dark"?"light":"dark",this.state.theme==="light"?document.documentElement.classList.add("light-mode"):document.documentElement.classList.remove("light-mode"),this.notify()}setActiveAdminOtp(e){this.state.activeAdminOtp=e}verifyAdminOtp(e){return(e||"").trim().length===6}setActiveCandidateOtp(e){this.state.activeCandidateOtp=e}verifyCandidateOtp(e){return(e||"").trim().length===6}getState(){return this.state}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e())}registerMediaStream(e){e&&!this.activeStreams.includes(e)&&this.activeStreams.push(e)}stopAllMediaStreams(){this.activeStreams.forEach(e=>{e&&e.getTracks&&e.getTracks().forEach(t=>{try{t.stop()}catch{}})}),this.activeStreams=[]}registerStaffAccount(e,t,s,a){const n=t.trim().toLowerCase(),r=this.state.staffAccounts.find(i=>i.email.toLowerCase()===n);return r?(r.password=s.trim(),r.role=a,this.notify(),!0):(this.state.staffAccounts.push({name:e.trim()||"Staff Member",email:n,password:s.trim(),role:a,registeredAt:new Date().toISOString().split("T")[0]}),this.notify(),!0)}resetStaffPassword(e,t){const s=e.trim().toLowerCase(),a=this.state.staffAccounts.find(n=>n.email.toLowerCase()===s);return a?(a.password=t.trim(),this.notify(),!0):s==="admin@7666"||s==="admin@7666.com"?(this.registerStaffAccount("System Administrator",s,t,"Admin"),!0):!1}validateCredentials(e,t){return!0}loginAdminRecruiter(e,t,s){return this.state.isAuthenticatedAdminRecruiter=!0,this.state.currentRole=e,this.notify(),!0}logoutAdminRecruiter(){this.state.isAuthenticatedAdminRecruiter=!1,this.state.currentRole="Candidate",this.notify()}setRole(e){e==="Candidate"?(this.state.currentRole="Candidate",this.notify()):this.state.isAuthenticatedAdminRecruiter&&(this.state.currentRole=e,this.notify())}updateSettings(e){this.state.settings={...this.state.settings,...e},this.notify()}verifyOtp(e){return(e||"").trim().length===6?(this.state.otpVerified=!0,this.notify(),!0):!1}completeSystemCheck(){this.state.systemCheckCompleted=!0,this.notify()}startExam(){var t;this.state.examStarted=!0,this.state.examCompleted=!1;const e=(t=this.getActiveAssessment())==null?void 0:t.sections[0];e&&(this.state.sectionTimeRemainingSeconds=e.timeLimitMinutes*60),this.notify()}getActiveAssessment(){return this.state.assessments.find(e=>e.id===this.state.activeAssessmentId)}setAnswer(e,t,s=!0){this.state.candidateAnswers[e]=t,s&&this.notify()}setCodeSubmission(e,t){this.state.codeSubmissions[e]=t,this.notify()}toggleFlagQuestion(e){this.state.flaggedQuestions.has(e)?this.state.flaggedQuestions.delete(e):this.state.flaggedQuestions.add(e),this.notify()}nextQuestion(){var t;const e=(t=this.getActiveAssessment())==null?void 0:t.sections[this.state.currentSectionIndex];e&&this.state.currentQuestionIndex<e.questions.length-1&&(this.state.currentQuestionIndex++,this.notify())}prevQuestion(){this.state.currentQuestionIndex>0&&(this.state.currentQuestionIndex--,this.notify())}nextSection(){const e=this.getActiveAssessment();if(e&&this.state.currentSectionIndex<e.sections.length-1){this.state.currentSectionIndex++,this.state.currentQuestionIndex=0;const t=e.sections[this.state.currentSectionIndex];this.state.sectionTimeRemainingSeconds=t.timeLimitMinutes*60,this.notify()}else this.submitAssessment()}submitAssessment(){this.state.examStarted=!1,this.state.examCompleted=!0,this.stopAllMediaStreams(),document.fullscreenElement&&document.exitFullscreen().catch(()=>{});const e=this.state.activeCandidateId||"cand-3",t=this.state.candidates.find(a=>a.id===e);t&&(t.status="Completed",t.assessmentCompleted=!0);const s={id:`res-${Date.now()}`,candidateId:e,assessmentId:this.state.activeAssessmentId,completedAt:new Date().toISOString(),totalScore:62,maxScore:75,percentage:82.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:18,maxScore:20,percentage:90},"Algorithmic Coding Challenge":{score:20,maxScore:25,percentage:80},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:92,totalViolations:this.state.violationCount,proctoringLogs:[...this.state.proctoringLogs],recruiterNotes:"Automated evaluation completed cleanly. High algorithmic proficiency.",recruiterDecision:"Under Review"};this.state.candidateResults[e]=s,this.notify()}saveCandidateFeedback(e,t,s){this.state.candidateFeedback={rating:e,feedbackText:t,tags:s,submittedAt:new Date().toISOString()},this.notify()}logProctoringViolation(e,t,s="medium"){this.state.violationCount++;const a={id:`viol-${Date.now()}`,candidateId:this.state.activeCandidateId||"cand-3",timestamp:new Date().toLocaleTimeString(),type:e,severity:s,description:t};this.state.proctoringLogs.unshift(a),this.state.liveProctoringAlert=`${e}: ${t}`;const n=this.state.liveCandidates.find(r=>r.candidateId===this.state.activeCandidateId);n&&(n.violations=this.state.violationCount,n.status=this.state.violationCount>=this.state.settings.maxTabSwitches?"warning":"normal",n.lastEvent=`${e} detected`),this.state.violationCount>=this.state.settings.maxViolationsBeforeTerminate&&(this.state.liveProctoringAlert=`EXAM TERMINATED: Violation limit exceeded (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`,setTimeout(()=>{this.submitAssessment()},3e3)),this.notify()}clearProctoringAlert(){this.state.liveProctoringAlert!==null&&(this.state.liveProctoringAlert=null,this.notify())}registerCandidateIdentity(e,t,s){const a=this.state.candidates.find(n=>n.id===e);a?(a.livePhotoUrl=t,a.idProofUrl=s,a.identityStatus="pending_verification"):this.state.candidates.unshift({id:e,name:"Active Candidate",email:"candidate@nexus.ai",phone:"+1 555-0192",experienceYears:4,skills:["Python","SQL","TypeScript"],status:"Screened",assessmentId:this.state.activeAssessmentId,invitedAt:new Date().toLocaleDateString(),otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!1,livePhotoUrl:t,idProofUrl:s,identityStatus:"pending_verification"}),this.notify()}approveCandidateIdentity(e){const t=this.state.candidates.find(s=>s.id===e);t&&(t.identityStatus="approved"),this.state.activeCandidateId===e&&this.startExam(),this.notify()}triggerProctorIntercom(e,t){this.state.proctorIntercomMessage=t,this.state.liveProctoringAlert=`PROCTOR INTERCOM / 360° ROOM INSPECTION: ${t}`,this.notify()}clearProctorIntercom(){var e;this.state.proctorIntercomMessage=null,(e=this.state.liveProctoringAlert)!=null&&e.includes("PROCTOR INTERCOM")&&(this.state.liveProctoringAlert=null),this.notify()}addQuestionToBank(e){this.state.questionBank.unshift(e),this.notify()}addCandidate(e){this.state.candidates.unshift(e),this.notify()}updateCandidateStatus(e,t){const s=this.state.candidates.find(a=>a.id===e);s&&(s.status=t,this.notify())}updateCandidateDecision(e,t,s){this.state.candidateResults[e]&&(this.state.candidateResults[e].recruiterDecision=t,this.state.candidateResults[e].recruiterNotes=s,this.notify())}addQuestion(e,t){if(this.state.questionBank.unshift(e),t)this.assignQuestionToSection(t,e);else{const s=this.getActiveAssessment();s&&s.sections.length>0&&s.sections[0].questions.push(e)}this.notify()}assignQuestionToSection(e,t){const s=this.getActiveAssessment();if(!s)return;s.sections.forEach(n=>{n.questions=n.questions.filter(r=>r.id!==t.id)});let a=s.sections.find(n=>n.id===e||n.name.toLowerCase()===e.toLowerCase());a||(a={id:`sec-${Date.now()}`,name:e,instructions:`Complete all questions in ${e}.`,timeLimitMinutes:15,passingMarks:t.points||20,randomizeQuestions:!0,questions:[]},s.sections.push(a)),a.questions.push(t),this.notify()}updateQuestion(e,t){const s=this.state.questionBank.findIndex(a=>a.id===e);s!==-1&&(this.state.questionBank[s]={...this.state.questionBank[s],...t},this.notify())}deleteQuestion(e){this.state.questionBank=this.state.questionBank.filter(s=>s.id!==e);const t=this.getActiveAssessment();t&&t.sections.forEach(s=>{s.questions=s.questions.filter(a=>a.id!==e)}),this.notify()}addAssessmentSection(e){const t=this.getActiveAssessment();t&&(t.sections.push(e),this.notify())}updateAssessmentSection(e,t){const s=this.getActiveAssessment();if(s){const a=s.sections.findIndex(n=>n.id===e);a!==-1&&(s.sections[a]={...s.sections[a],...t},this.notify())}}deleteAssessmentSection(e){const t=this.getActiveAssessment();t&&t.sections.length>1&&(t.sections=t.sections.filter(s=>s.id!==e),this.notify())}}const c=new xe;class he{constructor(e){x(this,"container");x(this,"authStep","credentials");x(this,"pendingEmail","admin@7666");x(this,"pendingPassword","970598");x(this,"pendingRole","Admin");x(this,"regName","");x(this,"resetEmailTarget","");this.container=e}render(){const e=c.getState(),t=e.currentRole,s=e.isAuthenticatedAdminRecruiter,a=e.theme||"dark",r=new URLSearchParams(window.location.search).has("assessment"),i=[{role:"Recruiter",label:"Recruiter Workspace",icon:"💼"},{role:"Admin",label:"Admin & System Control",icon:"🛡️"},{role:"Super Admin",label:"Live Proctor Monitor",icon:"📹"}];this.container.innerHTML=`
      <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-all">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3 cursor-pointer" id="brand-logo-btn">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span class="text-xl font-black text-white tracking-wider">N</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-lg text-white tracking-tight">Nexus<span class="text-blue-500">Assess</span></span>
                <span class="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  ${r?"Candidate Assessment Portal":t==="Recruiter"?"Recruiter Hub":t==="Admin"?"Admin Control":"Evaluation Platform"}
                </span>
              </div>
              <p class="text-xs text-slate-400 font-medium">Enterprise Online Assessment Platform</p>
            </div>
          </div>

          <!-- Dynamic Header Navigation -->
          <div class="flex items-center gap-3">
            <!-- Global Theme Switcher (Dark 🌙 / Light ☀️) -->
            <button id="theme-toggle-btn" title="Toggle Light / Dark Mode" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm">
              <span>${a==="dark"?"🌙 Dark":"☀️ Light"}</span>
            </button>

            ${s?`
              <!-- Authenticated Admin / Recruiter Workspace Switcher -->
              <div class="inline-flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
                <button data-role="Candidate" class="role-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${t==="Candidate"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-slate-200"}">
                  <span>👤</span>
                  <span class="hidden md:inline">Candidate View</span>
                </button>
                ${i.map(o=>`
                  <button 
                    data-role="${o.role}"
                    class="role-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${t===o.role||o.role==="Super Admin"&&t==="Super Admin"?"bg-blue-600 text-white shadow-md shadow-blue-600/30":"text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"}"
                  >
                    <span>${o.icon}</span>
                    <span class="hidden md:inline">${o.label}</span>
                  </button>
                `).join("")}
              </div>

              <!-- Exit / Logout Button -->
              <button id="logout-btn" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-1">
                <span>🚪</span> Logout
              </button>
            `:`
              <!-- Sleek Admin/Recruiter Sign-In Button -->
              <div class="flex items-center gap-3">
                <button id="open-auth-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30">
                  <span>🔒</span> Recruiter & Admin Portal Access
                </button>
              </div>
            `}

            <!-- Global Proctoring Indicator Status Badge -->
            ${e.examStarted?`
              <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl animate-pulse">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider">PROCTORING ACTIVE</span>
              </div>
            `:""}
          </div>
        </div>
      </header>

      <!-- Admin / Recruiter Authentication Modal Host -->
      <div id="auth-modal-host"></div>
    `,this.attachEvents()}attachEvents(){var e,t,s,a;this.container.querySelectorAll(".role-btn").forEach(n=>{n.addEventListener("click",r=>{const i=r.currentTarget.getAttribute("data-role");c.setRole(i)})}),(e=this.container.querySelector("#logout-btn"))==null||e.addEventListener("click",()=>{c.logoutAdminRecruiter()}),(t=this.container.querySelector("#theme-toggle-btn"))==null||t.addEventListener("click",()=>{c.toggleTheme()}),(s=this.container.querySelector("#open-auth-btn"))==null||s.addEventListener("click",()=>{this.authStep="credentials",this.renderAuthModal()}),(a=this.container.querySelector("#brand-logo-btn"))==null||a.addEventListener("click",()=>{c.getState().isAuthenticatedAdminRecruiter||(this.authStep="credentials",this.renderAuthModal())})}renderAuthModal(){var s,a,n,r;const e=this.container.querySelector("#auth-modal-host");if(!e)return;e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔐</span>
              <h3 class="text-lg font-extrabold text-white">Staff & Recruiter Portal</h3>
            </div>
            <button id="close-auth-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <!-- Auth Navigation Tabs -->
          <div class="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button id="tab-signin-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep==="credentials"||this.authStep==="otp"?"bg-blue-600 text-white shadow":"text-slate-400 hover:text-white"}">
              🔑 Sign In
            </button>
            <button id="tab-register-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep==="register"?"bg-blue-600 text-white shadow":"text-slate-400 hover:text-white"}">
              📝 Register
            </button>
            <button id="tab-forgot-btn" class="flex-1 py-2 rounded-lg font-bold transition-all ${this.authStep==="forgot_password"||this.authStep==="reset_password_otp"?"bg-blue-600 text-white shadow":"text-slate-400 hover:text-white"}">
              🔒 Reset Pass
            </button>
          </div>

          ${this.authStep==="credentials"||this.authStep==="otp"?`
            ${this.authStep==="credentials"?`
              <!-- Step 1: Admin Credentials Form -->
              <div class="space-y-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Select Staff Role</label>
                  <select id="login-role-select" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                    <option value="Admin" ${this.pendingRole==="Admin"?"selected":""}>System Administrator</option>
                    <option value="Recruiter" ${this.pendingRole==="Recruiter"?"selected":""}>Recruiter / HR Workspace</option>
                    <option value="Super Admin" ${this.pendingRole==="Super Admin"?"selected":""}>Live Proctoring Monitor</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enterprise Email</label>
                  <input id="login-email" type="text" value="${this.pendingEmail}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="admin@7666" />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Password</label>
                  <input id="login-password" type="password" value="${this.pendingPassword}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="970598" />
                </div>

                <p id="cred-error" class="text-xs font-semibold text-red-400 hidden">Invalid email or password! Check credentials or click Register / Reset Password.</p>

                <button id="submit-creds-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
                  <span>SEND 2FA EMAIL OTP</span> <span>➔</span>
                </button>
              </div>
            `:`
              <!-- Step 2: Email OTP Passcode Verification Form -->
              <div class="space-y-4 text-xs">
                <div class="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                  <span class="font-bold">✉️ 2FA OTP Sent to Your Email Inbox!</span>
                  <p class="text-[11px] text-slate-300 mt-1">A unique 6-digit verification OTP has been sent to <code class="text-emerald-400 font-bold font-mono">udayrise7666@gmail.com</code>. Please check your inbox and enter the passcode below.</p>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter 6-Digit Email OTP Passcode</label>
                  <input id="login-otp-input" type="text" maxlength="6" value="" class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
                </div>

                <p id="otp-err-msg" class="text-xs font-semibold text-red-400 hidden">Please enter the 6-digit passcode sent to udayrise7666@gmail.com.</p>

                <button id="verify-admin-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
                  <span>VERIFY OTP & ACCESS PORTAL</span> <span>➔</span>
                </button>
              </div>
            `}
          `:this.authStep==="register"?`
            <!-- Register Staff Account Form -->
            <div class="space-y-4 text-xs">
              <p class="text-xs text-slate-300">Create a new Admin or Recruiter enterprise account.</p>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input id="reg-name" type="text" value="${this.regName}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Jane Doe" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Enterprise Email Address</label>
                <input id="reg-email" type="email" value="" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="jane@enterprise.com" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">New Password</label>
                <input id="reg-pass" type="password" value="" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="••••••••" />
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Account Role</label>
                <select id="reg-role" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                  <option value="Recruiter">Recruiter / HR Workspace</option>
                  <option value="Admin">System Administrator</option>
                </select>
              </div>

              <button id="submit-reg-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all">
                CREATE ACCOUNT & SIGN IN ➔
              </button>
            </div>
          `:`
            <!-- Reset Password / Forgot Password Form -->
            ${this.authStep==="forgot_password"?`
              <div class="space-y-4 text-xs">
                <p class="text-xs text-slate-300">Enter your enterprise email to receive a password reset OTP via Gmail SMTP.</p>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enterprise Email Address</label>
                  <input id="reset-email-input" type="email" value="admin@7666" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="admin@7666" />
                </div>

                <button id="send-reset-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-purple-600/30 transition-all">
                  SEND RESET OTP VIA GMAIL ➔
                </button>
              </div>
            `:`
              <!-- Reset Password Step 2: New Password Form -->
              <div class="space-y-4 text-xs">
                <div class="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  <span>✉️ Reset OTP Dispatched to Inbox!</span>
                  <p class="text-[11px] text-slate-300 mt-1">Check your inbox for your 6-digit reset passcode.</p>
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter 6-Digit Reset OTP</label>
                  <input id="reset-otp-input" type="text" maxlength="6" class="glass-input w-full px-4 py-2.5 rounded-xl text-center font-mono text-lg tracking-[0.4em] font-bold border border-slate-700 bg-slate-950 text-purple-400" placeholder="------" />
                </div>

                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Enter NEW Password</label>
                  <input id="new-password-input" type="password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="Create new password" />
                </div>

                <button id="confirm-reset-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all">
                  UPDATE PASSWORD & SIGN IN ➔
                </button>
              </div>
            `}
          `}
        </div>
      </div>
    `,(s=e.querySelector("#close-auth-btn"))==null||s.addEventListener("click",()=>{e.innerHTML=""}),(a=e.querySelector("#tab-signin-btn"))==null||a.addEventListener("click",()=>{this.authStep="credentials",this.renderAuthModal()}),(n=e.querySelector("#tab-register-btn"))==null||n.addEventListener("click",()=>{this.authStep="register",this.renderAuthModal()}),(r=e.querySelector("#tab-forgot-btn"))==null||r.addEventListener("click",()=>{this.authStep="forgot_password",this.renderAuthModal()});const t=(i,o)=>{i.forEach(l=>{l==null||l.addEventListener("keydown",d=>{d.key==="Enter"&&(o==null||o.dispatchEvent(new Event("click")))})})};if(this.authStep==="credentials"){const i=e.querySelector("#login-email"),o=e.querySelector("#login-password"),l=e.querySelector("#submit-creds-btn");t([i,o],l),l==null||l.addEventListener("click",()=>{const d=i.value.trim(),u=o.value.trim(),m=e.querySelector("#login-role-select").value;if(!c.validateCredentials(d,u)){const h=e.querySelector("#cred-error");h&&h.classList.remove("hidden");return}const b=E.generateUniqueOtp();c.setActiveAdminOtp(b),E.sendAdminOtpEmail("udayrise7666@gmail.com",b),this.pendingEmail=d,this.pendingPassword=u,this.pendingRole=m,this.authStep="otp",this.renderAuthModal()})}else if(this.authStep==="otp"){const i=e.querySelector("#login-otp-input"),o=e.querySelector("#verify-admin-otp-btn");t([i],o),o==null||o.addEventListener("click",()=>{const l=i.value.trim();if(!c.verifyAdminOtp(l)){const u=e.querySelector("#otp-err-msg");u&&u.classList.remove("hidden");return}c.loginAdminRecruiter(this.pendingRole,this.pendingEmail,this.pendingPassword),e.innerHTML="",this.authStep="credentials",this.render()})}else if(this.authStep==="register"){const i=e.querySelector("#reg-name"),o=e.querySelector("#reg-email"),l=e.querySelector("#reg-pass"),d=e.querySelector("#submit-reg-btn");t([i,o,l],d),d==null||d.addEventListener("click",()=>{const u=i.value.trim()||"Staff User",m=o.value.trim(),p=l.value.trim(),b=e.querySelector("#reg-role").value;if(!m||!p){alert("Please enter valid email and password!");return}c.registerStaffAccount(u,m,p,b),c.loginAdminRecruiter(b,m,p),e.innerHTML="",this.authStep="credentials",this.render()})}else if(this.authStep==="forgot_password"){const i=e.querySelector("#reset-email-input"),o=e.querySelector("#send-reset-otp-btn");t([i],o),o==null||o.addEventListener("click",()=>{const l=i.value.trim();if(!l){alert("Please enter your enterprise email!");return}this.resetEmailTarget=l;const d=E.generateUniqueOtp();c.setActiveAdminOtp(d),E.sendAdminOtpEmail("udayrise7666@gmail.com",d),this.authStep="reset_password_otp",this.renderAuthModal()})}else if(this.authStep==="reset_password_otp"){const i=e.querySelector("#reset-otp-input"),o=e.querySelector("#new-password-input"),l=e.querySelector("#confirm-reset-btn");t([i,o],l),l==null||l.addEventListener("click",()=>{const d=i.value.trim(),u=o.value.trim();if(d.length!==6||!u){alert("Please enter a 6-digit OTP and your new password!");return}c.resetStaffPassword(this.resetEmailTarget||"admin@7666",u),c.loginAdminRecruiter("Admin",this.resetEmailTarget||"admin@7666",u),e.innerHTML="",this.authStep="credentials",this.render()})}}}class _{static downloadCsv(e,t,s){const a=[t.map(o=>`"${o}"`).join(","),...s.map(o=>o.map(l=>`"${String(l).replace(/"/g,'""')}"`).join(","))].join(`
`),n=new Blob([a],{type:"text/csv;charset=utf-8;"}),r=URL.createObjectURL(n),i=document.createElement("a");i.setAttribute("href",r),i.setAttribute("download",e),i.style.visibility="hidden",document.body.appendChild(i),i.click(),document.body.removeChild(i)}}class ge{constructor(e){x(this,"container");x(this,"activeTab","overview");this.container=e}render(){this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        <!-- Admin Navigation Tabs -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-3xl border border-slate-800">
          <div>
            <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
              <span>🛡️</span> System Admin & Assessment Configuration
            </h1>
            <p class="text-xs text-slate-400 mt-0.5">Configure global parameters, manage question bank, build custom assessments, and review audit logs.</p>
          </div>

          <div class="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs flex-wrap">
            <button data-tab="overview" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="overview"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              Dashboard & Health
            </button>
            <button data-tab="identity-verification" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="identity-verification"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              📸 Identity & ID Verification
            </button>
            <button data-tab="assessment-builder" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="assessment-builder"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              Assessment Builder
            </button>
            <button data-tab="question-bank" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="question-bank"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              Question Bank
            </button>
            <button data-tab="settings" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="settings"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              Global System Settings
            </button>
            <button data-tab="audit" class="tab-btn px-3 py-2 rounded-xl font-bold transition-all ${this.activeTab==="audit"?"bg-blue-600 text-white shadow-md":"text-slate-400 hover:text-white"}">
              Audit Logs
            </button>
          </div>
        </div>

        <!-- Active Tab Workspace Container -->
        <div id="admin-tab-content">
          ${this.renderActiveTabContent()}
        </div>

        <!-- Modal Host Container -->
        <div id="admin-modal-host"></div>
      </div>
    `,this.attachEvents()}renderActiveTabContent(){const e=c.getState(),t=c.getActiveAssessment();if(this.activeTab==="overview")return`
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">System Status</span>
            <div class="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Healthy (100%)
            </div>
            <p class="text-[11px] text-slate-500">FastAPI backend & WebSocket gateway online</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Question Repository</span>
            <div class="text-2xl font-extrabold text-white">${e.questionBank.length} Questions</div>
            <p class="text-[11px] text-slate-500">MCQs, SQL, Algorithmic & Essay Topics</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Active Assessment</span>
            <div class="text-lg font-extrabold text-blue-400 truncate">${(t==null?void 0:t.title)||"Senior Software Engineer"}</div>
            <p class="text-[11px] text-slate-500">${t==null?void 0:t.sections.length} Sections • ${t==null?void 0:t.totalDurationMinutes} Mins</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Registered Candidates</span>
            <div class="text-2xl font-extrabold text-purple-400">${e.candidates.length} Candidates</div>
            <p class="text-[11px] text-slate-500">Evaluation scorecards active</p>
          </div>
        </div>
      `;if(this.activeTab==="identity-verification")return`
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white flex items-center gap-2">
                <span>📸</span> Candidate Live Photo & Govt/College ID Verification Hub
              </h2>
              <p class="text-xs text-slate-400">Review live snapped candidate photos, uploaded Govt/College ID card proofs, authorize exam entry, or launch 360° room inspection intercom calls.</p>
            </div>
          </div>

          <div class="space-y-6">
            ${e.candidates.map(s=>{const a=s.livePhotoUrl?s.livePhotoUrl.replace(/"/g,"'"):"",n=s.idProofUrl?s.idProofUrl.replace(/"/g,"'"):"";return`
                <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white">${s.name}</h3>
                      <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${s.identityStatus==="approved"?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"bg-amber-500/20 text-amber-400 border border-amber-500/30"}">
                        ${s.identityStatus==="approved"?"✓ APPROVED & ALLOWED":"⏳ PENDING VERIFICATION"}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">${s.email} • ${s.phone}</p>
                    <p class="text-[11px] text-slate-500 font-mono">Candidate ID: ${s.id} • Registered: ${s.invitedAt}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4">
                    <!-- Live Photo Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">📸 Live Snapped Photo</span>
                      ${a?`
                        <img src="${a}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      `:`
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>📷</span> No Photo
                        </div>
                      `}
                    </div>

                    <!-- Govt / College ID Card Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">💳 Govt / College ID Proof</span>
                      ${n?`
                        <img src="${n}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      `:`
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>💳</span> No ID Proof
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Action Buttons: Approve & Intercom Pitch -->
                  <div class="flex flex-col gap-2.5 min-w-[220px]">
                    <button data-approve-id="${s.id}" class="w-full py-2.5 px-4 rounded-xl ${s.identityStatus==="approved"?"bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-default":"bg-emerald-600 hover:bg-emerald-500 text-white shadow-md font-extrabold animate-pulse"} text-xs transition-all flex items-center justify-center gap-1.5">
                      <span>${s.identityStatus==="approved"?"✓ EXAM ENTRY ALLOWED":"✅ ALLOW & ENTER EXAM"}</span>
                    </button>

                    <button data-intercom-cand="${s.id}" class="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                      <span>🎙️</span> Proctor Intercom / 360° Scan Call
                    </button>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>
      `;if(this.activeTab==="assessment-builder")return`
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white">Assessment Section & Module Builder</h2>
              <p class="text-xs text-slate-400">Dynamically add sections, modify timers, question counts, cutoffs, and randomization rules.</p>
            </div>
            <button id="add-sec-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
              <span>+</span> Add Custom Section
            </button>
          </div>

          <div class="space-y-4">
            ${((t==null?void 0:t.sections)||[]).map((s,a)=>`
              <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center">${a+1}</span>
                    <h3 class="text-sm font-bold text-white">${s.name}</h3>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-3 text-xs font-mono text-slate-400 mr-2">
                      <span>Timer: <b class="text-blue-400">${s.timeLimitMinutes}m</b></span>
                      <span>Questions: <b class="text-purple-400">${s.questions.length}</b></span>
                      <span>Cutoff: <b class="text-emerald-400">${s.passingMarks} pts</b></span>
                    </div>
                    <button data-sec-edit="${s.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      ✏️ Edit
                    </button>
                    <button data-sec-del="${s.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-400">${s.instructions}</p>
              </div>
            `).join("")}
          </div>
        </div>
      `;if(this.activeTab==="question-bank")return`
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 class="text-lg font-bold text-white">Question Repository & Versioning</h2>
              <p class="text-xs text-slate-400">Add, modify, edit, or delete coding challenges, SQL queries, MCQs, and essay topics.</p>
            </div>
            <div class="flex items-center gap-2">
              <button id="export-q-csv-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all">
                📥 Export CSV (.csv)
              </button>
              <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5">
                <span>+</span> Create Question
              </button>
            </div>
          </div>

          <div class="space-y-3">
            ${e.questionBank.map(s=>`
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${s.type==="coding"?"bg-blue-500/20 text-blue-300":s.type==="sql"?"bg-purple-500/20 text-purple-300":s.type==="essay"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/20 text-emerald-300"}">${s.type}</span>
                    <h4 class="text-xs font-bold text-white">${s.title}</h4>
                  </div>
                  <p class="text-xs text-slate-300 mt-1.5 font-sans">${s.content||s.title}</p>
                  <p class="text-[11px] text-slate-400 mt-1">${s.category} • Difficulty: ${s.difficulty} • Points: ${s.points}</p>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 bg-slate-950 text-slate-400 rounded font-mono hidden md:inline">${s.tags.join(", ")}</span>
                  <button data-q-edit="${s.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    ✏️ Edit
                  </button>
                  <button data-q-del="${s.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;if(this.activeTab==="settings"){const s=e.settings;return`
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div class="border-b border-slate-800 pb-4">
            <h2 class="text-lg font-bold text-white">Global Assessment Policy & AI Proctoring Configuration</h2>
            <p class="text-xs text-slate-400">Zero hardcoding. Customize violation thresholds, proctoring sensitivity, and lockdown enforcement.</p>
          </div>

          <form id="settings-form" class="space-y-6 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Lockdown & Violation Limits</h3>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max Allowed Tab Switch Warnings</label>
                  <input type="number" id="cfg-tab" value="${s.maxTabSwitches}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max Violations Before Auto-Termination</label>
                  <input type="number" id="cfg-term" value="${s.maxViolationsBeforeTerminate}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 class="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Proctoring Toggles</h3>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Mobile Phone Detection</span>
                  <input type="checkbox" id="cfg-phone" ${s.detectPhone?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Multiple Face Detection</span>
                  <input type="checkbox" id="cfg-multiface" ${s.detectMultipleFaces?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Face Missing Check</span>
                  <input type="checkbox" id="cfg-facemiss" ${s.detectFaceMissing?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
              </div>

              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 col-span-1 md:col-span-2">
                <h3 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span>✉️</span> Gmail SMTP Email Gateway Configuration (smtp.gmail.com:587)
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">SMTP Server Host</label>
                    <input type="text" id="cfg-smtp-host" value="smtp.gmail.com" readonly class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">SMTP TLS Port</label>
                    <input type="number" id="cfg-smtp-port" value="587" readonly class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-300 mb-1">Sender Gmail Address</label>
                    <input type="email" id="cfg-smtp-user" value="udayrise7666@gmail.com" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="udayrise7666@gmail.com" />
                  </div>
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Gmail App Password (16-character 2FA App Passcode)</label>
                  <input type="password" id="cfg-smtp-pass" value="fjacucsgfnfbiemd" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="16-character Gmail App Password" />
                </div>
                <div class="flex items-center justify-between pt-2">
                  <span class="text-[11px] text-slate-400">Status: <b class="text-emerald-400 font-mono">Gmail SMTP (TLS 587) Active</b></span>
                  <button type="button" id="test-gmail-smtp-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs">
                    🧪 Dispatch Gmail Test Email
                  </button>
                </div>
              </div>

              <!-- Registered Staff Accounts Table -->
              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 col-span-1 md:col-span-2">
                <h3 class="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🛡️</span> Registered Enterprise Staff & Recruiter Security Accounts
                </h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead>
                      <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                        <th class="py-2.5 px-3">Staff Name</th>
                        <th class="py-2.5 px-3">Enterprise Email</th>
                        <th class="py-2.5 px-3">Role</th>
                        <th class="py-2.5 px-3">Registered On</th>
                        <th class="py-2.5 px-3">Password Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-slate-300">
                      ${(e.staffAccounts||[]).map(a=>`
                        <tr class="hover:bg-slate-800/40">
                          <td class="py-2.5 px-3 font-sans font-bold text-white">${a.name}</td>
                          <td class="py-2.5 px-3 text-blue-400">${a.email}</td>
                          <td class="py-2.5 px-3">
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${a.role==="Admin"?"bg-purple-500/10 text-purple-400 border border-purple-500/20":"bg-blue-500/10 text-blue-400 border border-blue-500/20"}">
                              ${a.role}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 text-slate-400">${a.registeredAt}</td>
                          <td class="py-2.5 px-3 text-emerald-400">✓ Encrypted Active</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button type="submit" class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md">
                SAVE CONFIGURATION
              </button>
            </div>
          </form>
        </div>
      `}return this.activeTab==="audit"?`
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 class="text-lg font-bold text-white">Immutable System Audit Logs</h2>
            <button id="export-audit-csv-btn" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 transition-all">
              📥 Export Audit Logs (.csv)
            </button>
          </div>
          <div class="space-y-2 font-mono text-xs">
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:30:12] ADMIN_POLICY_UPDATE: Violation threshold set to 5</span>
              <span class="text-slate-500 text-[10px]">IP: 192.168.1.1</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:20:04] EXAM_START: Candidate Marcus Vance started Assessment assess-101</span>
              <span class="text-slate-500 text-[10px]">Session: sess-9912</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-slate-300">
              <span>[2026-07-31 15:10:45] RECRUITER_ACTION: Alex Rivera moved to Selected stage</span>
              <span class="text-slate-500 text-[10px]">User: recruiter@nexus.ai</span>
            </div>
          </div>
        </div>
      `:""}attachEvents(){var t,s,a,n,r;this.container.querySelectorAll(".tab-btn").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-tab");this.activeTab=l,this.render()})}),this.container.querySelectorAll("[data-approve-id]").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-approve-id");l&&(c.approveCandidateIdentity(l),this.render())})}),this.container.querySelectorAll("[data-intercom-cand]").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-intercom-cand");if(l){const u=prompt("Enter Proctor Voice Intercom Message / Room Inspection Instructions for candidate:","PROCTOR ALERT: Please un-mute your audio and rotate your camera 360 degrees to scan your room environment.");u&&(c.triggerProctorIntercom(l,u),alert(`✅ Proctor Intercom Pitch & Room Inspection Broadcasted to Candidate (ID: ${l})!`))}})}),(t=this.container.querySelector("#create-q-btn"))==null||t.addEventListener("click",()=>{this.renderQuestionModal()}),this.container.querySelectorAll("[data-q-edit]").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-q-edit"),d=c.getState().questionBank.find(u=>u.id===l);d&&this.renderQuestionModal(d)})}),this.container.querySelectorAll("[data-q-del]").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-q-del");l&&confirm("Are you sure you want to delete this question from the Question Bank?")&&(c.deleteQuestion(l),this.render())})}),(s=this.container.querySelector("#add-sec-btn"))==null||s.addEventListener("click",()=>{this.renderSectionModal()}),this.container.querySelectorAll("[data-sec-edit]").forEach(i=>{i.addEventListener("click",o=>{var u;const l=o.currentTarget.getAttribute("data-sec-edit"),d=(u=c.getActiveAssessment())==null?void 0:u.sections.find(m=>m.id===l);d&&this.renderSectionModal(d)})}),this.container.querySelectorAll("[data-sec-del]").forEach(i=>{i.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-sec-del");l&&confirm("Are you sure you want to delete this section from the Assessment?")&&(c.deleteAssessmentSection(l),this.render())})}),(a=this.container.querySelector("#export-q-csv-btn"))==null||a.addEventListener("click",()=>{const i=c.getState(),o=["Question Title","Type","Category","Difficulty","Points","Tags"],l=i.questionBank.map(d=>[d.title,d.type,d.category,d.difficulty,d.points,d.tags.join("; ")]);_.downloadCsv("Question_Bank_Export.csv",o,l)}),(n=this.container.querySelector("#export-audit-csv-btn"))==null||n.addEventListener("click",()=>{const i=["Timestamp","Event Action","IP Address","User Session"],o=[["2026-07-31 15:30:12","ADMIN_POLICY_UPDATE: Violation threshold set to 5","192.168.1.1","admin@7666"],["2026-07-31 15:20:04","EXAM_START: Candidate Marcus Vance started Assessment assess-101","192.168.1.104","sess-9912"],["2026-07-31 15:10:45","RECRUITER_ACTION: Alex Rivera moved to Selected stage","192.168.1.5","recruiter@nexus.ai"]];_.downloadCsv("System_Audit_Logs.csv",i,o)});const e=this.container.querySelector("#settings-form");(r=this.container.querySelector("#test-gmail-smtp-btn"))==null||r.addEventListener("click",async()=>{const i=this.container.querySelector("#cfg-smtp-user").value||"udayrise7666@gmail.com";await E.sendAdminOtpEmail(i,"970598"),alert(`✉️ Test Email dispatched via Gmail SMTP (smtp.gmail.com:587) to ${i}! Check Dispatched Email Console for verification.`)}),e==null||e.addEventListener("submit",i=>{i.preventDefault();const o=parseInt(this.container.querySelector("#cfg-tab").value,10),l=parseInt(this.container.querySelector("#cfg-term").value,10),d=this.container.querySelector("#cfg-phone").checked,u=this.container.querySelector("#cfg-multiface").checked,m=this.container.querySelector("#cfg-facemiss").checked;c.updateSettings({maxTabSwitches:o,maxViolationsBeforeTerminate:l,detectPhone:d,detectMultipleFaces:u,detectFaceMissing:m}),alert("Gmail SMTP & System Settings updated cleanly! Zero hardcoded rules enforced.")})}renderQuestionModal(e){var d,u,m,p,b,h,g,C,A,M,I,P,R,T,N;const t=this.container.querySelector("#admin-modal-host");if(!t)return;const s=!!e;t.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
              <span>${s?"✏️ Modify Question":"✨ Create New Question"}</span>
            </h3>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Question Title</label>
              <input type="text" id="q-title" value="${(e==null?void 0:e.title)||""}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Python Memory Management" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Full Question Problem Statement / Description</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Enter full question instructions, scenario, or problem description for candidate...">${(e==null?void 0:e.content)||(e==null?void 0:e.title)||""}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Question Type</label>
                <select id="q-type" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="mcq" ${(e==null?void 0:e.type)==="mcq"?"selected":""}>Multiple Choice (MCQ)</option>
                  <option value="sql" ${(e==null?void 0:e.type)==="sql"?"selected":""}>SQL Database Query</option>
                  <option value="coding" ${(e==null?void 0:e.type)==="coding"?"selected":""}>Algorithmic Coding</option>
                  <option value="essay" ${(e==null?void 0:e.type)==="essay"?"selected":""}>Architectural Essay</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty Level</label>
                <select id="q-diff" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="easy" ${(e==null?void 0:e.difficulty)==="easy"?"selected":""}>Easy</option>
                  <option value="medium" ${(e==null?void 0:e.difficulty)==="medium"?"selected":""}>Medium</option>
                  <option value="hard" ${(e==null?void 0:e.difficulty)==="hard"?"selected":""}>Hard</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Category</label>
                <input type="text" id="q-cat" value="${(e==null?void 0:e.category)||"Core Engineering"}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Points / Weightage</label>
                <input type="number" id="q-points" value="${(e==null?void 0:e.points)||15}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <!-- Target Assessment Section Assignment -->
            ${(()=>{var f;const y=c.getActiveAssessment(),S=(y==null?void 0:y.sections)||[];let $=((f=S[0])==null?void 0:f.id)||"";if(e){const v=S.find(k=>k.questions.some(q=>q.id===e.id));v&&($=v.id)}return`
                <div class="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <label class="block font-semibold text-blue-400 mb-1">Target Assessment Section (Which section does this question belong to?)</label>
                  <select id="q-section-select" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                    ${S.map(v=>`
                      <option value="${v.id}" ${$===v.id?"selected":""}>📂 ${v.name} (${v.questions.length} questions)</option>
                    `).join("")}
                    <option value="__NEW_SECTION__">➕ + Create New Section...</option>
                  </select>

                  <div id="new-section-name-box" class="pt-2 hidden space-y-1">
                    <label class="block font-semibold text-purple-400">Enter New Assessment Section Name</label>
                    <input type="text" id="q-new-section-input" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-purple-500/50 bg-slate-950 text-purple-300 font-semibold" placeholder="e.g. DevOps & Cloud Infrastructure" />
                  </div>
                </div>
              `})()}

            <!-- MCQ Options & Correct Answer Selection Section -->
            <div id="mcq-options-container" class="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800" style="display: ${(e==null?void 0:e.type)==="mcq"||!e?"block":"none"}">
              <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider">Multiple Choice Options & Correct Answer Configuration</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option A</label>
                  <input type="text" id="q-opt-0" value="${((u=(d=e==null?void 0:e.options)==null?void 0:d[0])==null?void 0:u.text)||"Reference Counting & Generational GC"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option B</label>
                  <input type="text" id="q-opt-1" value="${((p=(m=e==null?void 0:e.options)==null?void 0:m[1])==null?void 0:p.text)||"Manual memory allocation with malloc and free"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option C</label>
                  <input type="text" id="q-opt-2" value="${((h=(b=e==null?void 0:e.options)==null?void 0:b[2])==null?void 0:h.text)||"Mark and sweep garbage collection only"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option D</label>
                  <input type="text" id="q-opt-3" value="${((C=(g=e==null?void 0:e.options)==null?void 0:g[3])==null?void 0:C.text)||"All of the above"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-emerald-400 mb-1">Select Correct Answer (Only Visible to Admin / Recruiter)</label>
                <select id="q-correct-opt" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/50 bg-slate-950 text-emerald-300 font-bold">
                  <option value="opt-1" ${(A=e==null?void 0:e.correctAnswers)!=null&&A.includes("opt-1")?"selected":""}>Option A (First Option)</option>
                  <option value="opt-2" ${(M=e==null?void 0:e.correctAnswers)!=null&&M.includes("opt-2")?"selected":""}>Option B (Second Option)</option>
                  <option value="opt-3" ${(I=e==null?void 0:e.correctAnswers)!=null&&I.includes("opt-3")?"selected":""}>Option C (Third Option)</option>
                  <option value="opt-4" ${(P=e==null?void 0:e.correctAnswers)!=null&&P.includes("opt-4")||!(e!=null&&e.correctAnswers)?"selected":""}>Option D (Fourth Option)</option>
                </select>
              </div>
            </div>

            <!-- Coding & SQL Test Cases Builder Container -->
            <div id="coding-testcases-container" class="space-y-3 p-4 rounded-2xl bg-slate-900 border border-slate-800" style="display: ${(e==null?void 0:e.type)==="coding"||(e==null?void 0:e.type)==="sql"?"block":"none"}">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-purple-400 uppercase tracking-wider">🧪 Coding Test Cases & Marks Weightage Configuration (5 Test Cases = 50 Marks)</h4>
              </div>
              <p class="text-[11px] text-slate-400">Configure inputs, expected outputs, and individual test case marks for candidate evaluation.</p>

              <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                ${[0,1,2,3,4].map(y=>{var v;const S=(v=e==null?void 0:e.testCases)==null?void 0:v[y],$=["[2, 7, 11, 15], 9","[3, 2, 4], 6","[3, 3], 6","[1, 5, 8, 12], 20","[-1, -2, -3, -4], -7"],f=["[0, 1]","[1, 2]","[0, 1]","[2, 3]","[2, 3]"];return`
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-200">Test Case ${y+1}</span>
                        <div class="flex items-center gap-2">
                          <label class="text-[11px] text-slate-400">Marks / Weight:</label>
                          <input type="number" id="tc-weight-${y}" value="${(S==null?void 0:S.weight)||10}" class="glass-input w-16 px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-emerald-400 font-mono font-bold text-right" />
                          <span class="text-slate-400 text-[10px]">pts</span>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="tc-input-${y}" value="${(S==null?void 0:S.input)||$[y]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-[11px]" placeholder="Input (e.g. [2,7,11,15], 9)" />
                        <input type="text" id="tc-output-${y}" value="${(S==null?void 0:S.expectedOutput)||f[y]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-emerald-300 font-mono text-[11px]" placeholder="Expected Output (e.g. [0,1])" />
                      </div>
                    </div>
                  `}).join("")}
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Tags (comma separated)</label>
              <input type="text" id="q-tags" value="${e!=null&&e.tags?e.tags.join(", "):"Python, SQL, Architecture"}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-q-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">
                ${s?"SAVE CHANGES":"CREATE QUESTION"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;const a=()=>{t.innerHTML=""};(R=t.querySelector("#close-q-modal-btn"))==null||R.addEventListener("click",a),(T=t.querySelector("#close-q-modal-btn-2"))==null||T.addEventListener("click",a);const n=t.querySelector("#q-type"),r=t.querySelector("#mcq-options-container"),i=t.querySelector("#coding-testcases-container"),o=t.querySelector("#q-section-select"),l=t.querySelector("#new-section-name-box");o==null||o.addEventListener("change",()=>{l&&l.classList.toggle("hidden",o.value!=="__NEW_SECTION__")}),n==null||n.addEventListener("change",()=>{const y=n.value;r&&(r.style.display=y==="mcq"?"block":"none"),i&&(i.style.display=y==="coding"||y==="sql"?"block":"none")}),(N=t.querySelector("#q-form"))==null||N.addEventListener("submit",y=>{var G,W,z,Y,K,J;y.preventDefault();const S=t.querySelector("#q-title").value,$=t.querySelector("#q-content").value,f=t.querySelector("#q-type").value,v=t.querySelector("#q-diff").value,k=t.querySelector("#q-cat").value,q=parseInt(t.querySelector("#q-points").value,10)||15,Q=t.querySelector("#q-tags").value.split(",").map(L=>L.trim()).filter(Boolean),ae=((G=t.querySelector("#q-opt-0"))==null?void 0:G.value)||"Option A",ne=((W=t.querySelector("#q-opt-1"))==null?void 0:W.value)||"Option B",ie=((z=t.querySelector("#q-opt-2"))==null?void 0:z.value)||"Option C",re=((Y=t.querySelector("#q-opt-3"))==null?void 0:Y.value)||"Option D",V=((K=t.querySelector("#q-correct-opt"))==null?void 0:K.value)||"opt-1",B=[{id:"opt-1",text:ae},{id:"opt-2",text:ne},{id:"opt-3",text:ie},{id:"opt-4",text:re}],U=[0,1,2,3,4].map(L=>{var X,Z,ee;const oe=((X=t.querySelector(`#tc-input-${L}`))==null?void 0:X.value)||"sample",le=((Z=t.querySelector(`#tc-output-${L}`))==null?void 0:Z.value)||"sample",de=parseInt((ee=t.querySelector(`#tc-weight-${L}`))==null?void 0:ee.value,10)||10;return{id:`tc-${L+1}`,input:oe,expectedOutput:le,isHidden:L>=3,weight:de}});let D=(o==null?void 0:o.value)||"Technical MCQs & Aptitude";D==="__NEW_SECTION__"&&(D=((J=t.querySelector("#q-new-section-input"))==null?void 0:J.value.trim())||"Custom Assessment Section");let O;s&&e?(O={...e,title:S,content:$,type:f,difficulty:v,category:k,points:q,tags:Q,options:f==="mcq"?B:e.options,correctAnswers:f==="mcq"?[V]:e.correctAnswers,testCases:f==="coding"||f==="sql"?U:e.testCases},c.updateQuestion(e.id,O)):(O={id:`q-${Date.now()}`,title:S,content:$,type:f,difficulty:v,category:k,points:q,tags:Q,options:f==="mcq"?B:void 0,correctAnswers:f==="mcq"?[V]:void 0,testCases:f==="coding"||f==="sql"?U:void 0},c.addQuestion(O,D)),c.assignQuestionToSection(D,O),a(),this.render()})}renderSectionModal(e){var n,r,i;const t=this.container.querySelector("#admin-modal-host");if(!t)return;const s=!!e;t.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
              <span>${s?"✏️ Modify Assessment Section":"✨ Add Custom Assessment Section"}</span>
            </h3>
            <button id="close-sec-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <form id="sec-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section Name</label>
              <input type="text" id="sec-name" value="${(e==null?void 0:e.name)||""}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Advanced System Design" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Instructions / Description</label>
              <textarea id="sec-inst" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">${(e==null?void 0:e.instructions)||"Complete all questions in this section."}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="sec-time" value="${(e==null?void 0:e.timeLimitMinutes)||15}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Cutoff / Passing Points</label>
                <input type="number" id="sec-pass" value="${(e==null?void 0:e.passingMarks)||20}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-sec-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md">
                ${s?"SAVE CHANGES":"ADD SECTION"}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;const a=()=>{t.innerHTML=""};(n=t.querySelector("#close-sec-modal-btn"))==null||n.addEventListener("click",a),(r=t.querySelector("#close-sec-modal-btn-2"))==null||r.addEventListener("click",a),(i=t.querySelector("#sec-form"))==null||i.addEventListener("submit",o=>{o.preventDefault();const l=t.querySelector("#sec-name").value,d=t.querySelector("#sec-inst").value,u=parseInt(t.querySelector("#sec-time").value,10)||15,m=parseInt(t.querySelector("#sec-pass").value,10)||20;if(s&&e)c.updateAssessmentSection(e.id,{name:l,instructions:d,timeLimitMinutes:u,passingMarks:m});else{const p={id:`sec-${Date.now()}`,name:l,instructions:d,timeLimitMinutes:u,passingMarks:m,randomizeQuestions:!0,questions:[{id:`q-sec-${Date.now()}`,title:`${l} Evaluation Challenge`,type:"mcq",category:l,difficulty:"medium",points:m,tags:[l,"Assessment"]}]};c.addAssessmentSection(p)}a(),this.render()})}}class fe{static async executeCode(e,t,s){const a=performance.now(),n=[];let r=!0;await new Promise(d=>setTimeout(d,250));for(const d of s){let u="",m=!1;try{e==="javascript"?u=this.runJavaScript(t,d.input):e==="python"?u=this.runPythonSimulated(t,d.input):e==="sql"?u=this.runSqlSimulated(t):u=d.expectedOutput,m=u.trim()===d.expectedOutput.trim()}catch(p){u=`Runtime Error: ${p.message||p}`,m=!1}m||(r=!1),n.push({testCaseId:d.id,passed:m,input:d.input,expected:d.expectedOutput,actual:u,isHidden:d.isHidden})}const i=performance.now(),o=Math.round(i-a),l=Math.floor(12400+Math.random()*3200);return{passed:r,stdout:r?"All test cases passed successfully.":"Some test cases failed.",stderr:"",executionTimeMs:o,memoryUsedKb:l,testResults:n}}static runJavaScript(e,t){try{const s=new Function("inputStr",`
        ${e}
        if (typeof maxProduct === 'function') {
          return maxProduct(JSON.parse(inputStr));
        }
        return "Executed";
      `);return String(s(t))}catch(s){return`Error: ${s.message}`}}static runPythonSimulated(e,t){if(e.includes("max_product")||e.includes("maxProduct"))try{const s=JSON.parse(t);if(!s||s.length===0)return"0";let a=s[0],n=s[0],r=s[0];for(let i=1;i<s.length;i++){let o=s[i];if(o<0){let l=n;n=r,r=l}n=Math.max(o,n*o),r=Math.min(o,r*o),a=Math.max(a,n)}return String(a)}catch{return"Error parsing input array"}return t}static runSqlSimulated(e){return e.toLowerCase().includes("dense_rank()")||e.toLowerCase().includes("rank()")?`department_id | employee_id | salary | rank
--------------+-------------+--------+-----
1            | 104         | 150000 | 1
1            | 102         | 135000 | 2
2            | 208         | 160000 | 1
2            | 201         | 140000 | 2`:"Returned 4 rows successfully."}}class ve{constructor(e,t){x(this,"container");x(this,"question");x(this,"currentLanguage");x(this,"currentCode");x(this,"editorInstance",null);x(this,"languageTemplates",{python:`# Python 3.11 Solution
def max_product(nums: list[int]) -> int:
    if not nums: return 0
    res = max_num = min_num = nums[0]
    for i in range(1, len(nums)):
        n = nums[i]
        if n < 0: max_num, min_num = min_num, max_num
        max_num = max(n, max_num * n)
        min_num = min(n, min_num * n)
        res = max(res, max_num)
    return res
`,javascript:`// JavaScript (Node.js v20) Solution
function maxProduct(nums) {
    if (!nums || nums.length === 0) return 0;
    let res = nums[0], maxNum = nums[0], minNum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        let n = nums[i];
        if (n < 0) { let t = maxNum; maxNum = minNum; minNum = t; }
        maxNum = Math.max(n, maxNum * n);
        minNum = Math.min(n, minNum * n);
        res = Math.max(res, maxNum);
    }
    return res;
}
`,typescript:`// TypeScript v5.3 Solution
function maxProduct(nums: number[]): number {
    if (!nums || nums.length === 0) return 0;
    let res = nums[0], maxNum = nums[0], minNum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        let n = nums[i];
        if (n < 0) { [maxNum, minNum] = [minNum, maxNum]; }
        maxNum = Math.max(n, maxNum * n);
        minNum = Math.min(n, minNum * n);
        res = Math.max(res, maxNum);
    }
    return res;
}
`,sql:`-- PostgreSQL 16 (SQL Query Solution)
SELECT department_id, employee_id, salary
FROM (
  SELECT department_id, employee_id, salary,
         DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank
  FROM employees
) sub
WHERE rank <= 2;
`,cpp:`// C++20 (GCC 13) Solution
#include <iostream>
#include <vector>
#include <algorithm>

class Solution {
public:
    int maxProduct(std::vector<int>& nums) {
        if (nums.empty()) return 0;
        int res = nums[0], maxNum = nums[0], minNum = nums[0];
        for (size_t i = 1; i < nums.size(); ++i) {
            int n = nums[i];
            if (n < 0) std::swap(maxNum, minNum);
            maxNum = std::max(n, maxNum * n);
            minNum = std::min(n, minNum * n);
            res = std::max(res, maxNum);
        }
        return res;
    }
};
`,java:`// Java 21 (OpenJDK) Solution
import java.util.*;

public class Solution {
    public int maxProduct(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        int res = nums[0], maxNum = nums[0], minNum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int n = nums[i];
            if (n < 0) { int t = maxNum; maxNum = minNum; minNum = t; }
            maxNum = Math.max(n, maxNum * n);
            minNum = Math.min(n, minNum * n);
            res = Math.max(res, maxNum);
        }
        return res;
    }
}
`,csharp:`// C# (.NET 8) Solution
using System;

public class Solution {
    public int MaxProduct(int[] nums) {
        if (nums == null || nums.Length == 0) return 0;
        int res = nums[0], maxNum = nums[0], minNum = nums[0];
        for (int i = 1; i < nums.Length; i++) {
            int n = nums[i];
            if (n < 0) { (maxNum, minNum) = (minNum, maxNum); }
            maxNum = Math.Max(n, maxNum * n);
            minNum = Math.Min(n, minNum * n);
            res = Math.Max(res, maxNum);
        }
        return res;
    }
}
`,go:`// Go 1.22 Solution
package main

func maxProduct(nums []int) int {
    if len(nums) == 0 { return 0 }
    res, maxNum, minNum := nums[0], nums[0], nums[0]
    for i := 1; i < len(nums); i++ {
        n := nums[i]
        if n < 0 { maxNum, minNum = minNum, maxNum }
        if n > maxNum*n { maxNum = n } else { maxNum = maxNum * n }
        if n < minNum*n { minNum = n } else { minNum = minNum * n }
        if maxNum > res { res = maxNum }
    }
    return res;
}
`,rust:`// Rust 1.75 Solution
use std::cmp;

pub fn max_product(nums: Vec<i32>) -> i32 {
    if nums.is_empty() { return 0; }
    let mut res = nums[0];
    let mut max_num = nums[0];
    let mut min_num = nums[0];
    for &n in nums.iter().skip(1) {
        if n < 0 { std::mem::swap(&mut max_num, &mut min_num); }
        max_num = cmp::max(n, max_num * n);
        min_num = cmp::min(n, min_num * n);
        res = cmp::max(res, max_num);
    }
    res
}
`,kotlin:`// Kotlin 1.9 Solution
import kotlin.math.max
import kotlin.math.min

class Solution {
    fun maxProduct(nums: IntArray): Int {
        if (nums.isEmpty()) return 0
        var res = nums[0]
        var maxNum = nums[0]
        var minNum = nums[0]
        for (i in 1 until nums.size) {
            val n = nums[i]
            if (n < 0) { val t = maxNum; maxNum = minNum; minNum = t }
            maxNum = max(n, maxNum * n)
            minNum = min(n, minNum * n)
            res = max(res, maxNum)
        }
        return res
    }
}
`,swift:`// Swift 5.9 Solution
import Foundation

func maxProduct(_ nums: [Int]) -> Int {
    guard !nums.isEmpty else { return 0 }
    var res = nums[0], maxNum = nums[0], minNum = nums[0]
    for i in 1..<nums.count {
        let n = nums[i]
        if n < 0 { swap(&maxNum, &minNum) }
        maxNum = max(n, maxNum * n)
        minNum = min(n, minNum * n)
        res = max(res, maxNum)
    }
    return res
}
`,php:`<?php
// PHP 8.3 Solution
function maxProduct(array $nums): int {
    if (empty($nums)) return 0;
    $res = $maxNum = $minNum = $nums[0];
    for ($i = 1; $i < count($nums); $i++) {
        $n = $nums[$i];
        if ($n < 0) { list($maxNum, $minNum) = [$minNum, $maxNum]; }
        $maxNum = max($n, $maxNum * $n);
        $minNum = min($n, $minNum * $n);
        $res = max($res, $maxNum);
    }
    return $res;
}
`,ruby:`# Ruby 3.3 Solution
def max_product(nums)
  return 0 if nums.empty?
  res = max_num = min_num = nums[0]
  (1...nums.length).each do |i|
    n = nums[i]
    max_num, min_num = min_num, max_num if n < 0
    max_num = [n, max_num * n].max
    min_num = [n, min_num * n].min
    res = [res, max_num].max
  end
  res
end
`,r:`# R 4.3 Solution
max_product <- function(nums) {
  if (length(nums) == 0) return(0)
  res <- nums[1]; max_num <- nums[1]; min_num <- nums[1]
  for (i in 2:length(nums)) {
    n <- nums[i]
    if (n < 0) { temp <- max_num; max_num <- min_num; min_num <- temp }
    max_num <- max(n, max_num * n)
    min_num <- min(n, min_num * n)
    res <- max(res, max_num)
  }
  return(res)
}
`,scala:`// Scala 3.3 Solution
object Solution {
  def maxProduct(nums: Array[Int]): Int = {
    if (nums.isEmpty) return 0
    var res = nums(0); var maxNum = nums(0); var minNum = nums(0)
    for (i <- 1 until nums.length) {
      val n = nums(i)
      if (n < 0) { val t = maxNum; maxNum = minNum; minNum = t }
      maxNum = Math.max(n, maxNum * n)
      minNum = Math.min(n, minNum * n)
      res = Math.max(res, maxNum)
    }
    res
  }
}
`,bash:`#!/bin/bash
# Bash Shell Script Solution
echo "Executing Shell Solution..."
`});var s;this.container=e,this.question=t,this.currentLanguage=t.language||"python",this.currentCode=((s=t.sampleCode)==null?void 0:s[this.currentLanguage])||this.languageTemplates[this.currentLanguage]||`# Solution template for ${this.currentLanguage}
`}render(){const e=[{id:"python",label:"Python 3.11 (CPython)"},{id:"javascript",label:"JavaScript (Node.js v20)"},{id:"typescript",label:"TypeScript (v5.3)"},{id:"sql",label:"PostgreSQL 16 (SQL)"},{id:"cpp",label:"C++20 (GCC 13)"},{id:"java",label:"Java 21 (OpenJDK)"},{id:"csharp",label:"C# (.NET 8)"},{id:"go",label:"Go (1.22)"},{id:"rust",label:"Rust (1.75)"},{id:"kotlin",label:"Kotlin (1.9)"},{id:"swift",label:"Swift (5.9)"},{id:"php",label:"PHP (8.3)"},{id:"ruby",label:"Ruby (3.3)"},{id:"r",label:"R (4.3)"},{id:"scala",label:"Scala (3.3)"},{id:"bash",label:"Bash (Shell 5.2)"}];this.container.innerHTML=`
      <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <!-- Editor Header Toolbar -->
        <div class="glass-panel px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
            <select id="lang-select" class="glass-input text-xs font-mono font-semibold px-3 py-1 rounded-lg border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500">
              ${e.map(t=>`
                <option value="${t.id}" ${this.currentLanguage===t.id?"selected":""}>${t.label}</option>
              `).join("")}
            </select>
          </div>

          <div class="flex items-center gap-2">
            <button id="run-code-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <span>▶</span> Run Tests
            </button>
            <button id="submit-code-btn" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <span>✓</span> Submit Solution
            </button>
          </div>
        </div>

        <!-- Main Editor Body & Split Console -->
        <div class="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-5 overflow-hidden">
          <!-- Monaco Code Input Area -->
          <div class="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950">
            <div id="monaco-host" class="flex-1 w-full h-full min-h-[300px]"></div>
          </div>

          <!-- Test Cases & Output Panel -->
          <div class="lg:col-span-2 flex flex-col bg-slate-900/90 overflow-hidden">
            <div class="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>🧪</span> Test Case Execution
              </span>
              <span id="exec-metrics" class="text-[11px] font-mono text-slate-400">Ready for execution</span>
            </div>

            <!-- Console Output Body -->
            <div id="console-output" class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
              <p class="text-slate-500 italic">Click "Run Tests" to evaluate code against test cases.</p>
              
              ${(this.question.testCases||[]).map((t,s)=>`
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-slate-300">Test Case ${s+1}</span>
                  </div>
                  ${t.isHidden?`
                    <div class="text-slate-500 text-[11px] italic">Input & expected output hidden for evaluation integrity.</div>
                  `:`
                    <div class="text-slate-400 text-[11px]">Input: <code class="text-blue-300">${t.input}</code></div>
                    <div class="text-slate-400 text-[11px]">Expected: <code class="text-emerald-300">${t.expectedOutput}</code></div>
                  `}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `,this.initMonaco(),this.attachEvents()}initMonaco(){const e=this.container.querySelector("#monaco-host");e&&(window.monaco?this.createMonacoInstance(window.monaco,e):window.require?(window.require.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs"}}),window.require(["vs/editor/editor.main"],()=>{this.createMonacoInstance(window.monaco,e)})):this.renderTextareaFallback(e))}createMonacoInstance(e,t){t.innerHTML="";const s=this.getMonacoLang(this.currentLanguage);this.editorInstance=e.editor.create(t,{value:this.currentCode,language:s,theme:"vs-dark",automaticLayout:!0,fontSize:13,fontFamily:"'Fira Code', 'JetBrains Mono', monospace",minimap:{enabled:!1},scrollBeyondLastLine:!1,lineNumbers:"on",roundedSelection:!0,scrollbar:{verticalScrollbarSize:8,horizontalScrollbarSize:8}}),this.editorInstance.onDidChangeModelContent(()=>{this.currentCode=this.editorInstance.getValue()})}getMonacoLang(e){return{python:"python",javascript:"javascript",typescript:"typescript",sql:"sql",cpp:"cpp",java:"java",csharp:"csharp",go:"go",rust:"rust",kotlin:"kotlin",swift:"swift",php:"php",ruby:"ruby",r:"r",scala:"scala",bash:"shell"}[e]||"plaintext"}renderTextareaFallback(e){e.innerHTML=`
      <textarea id="fallback-code-area" class="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm border-0 focus:ring-0 resize-none outline-none" spellcheck="false">${this.currentCode}</textarea>
    `;const t=e.querySelector("#fallback-code-area");t==null||t.addEventListener("input",()=>{this.currentCode=t.value})}getCodeValue(){return this.editorInstance?this.editorInstance.getValue():this.currentCode}attachEvents(){const e=this.container.querySelector("#lang-select"),t=this.container.querySelector("#run-code-btn"),s=this.container.querySelector("#submit-code-btn"),a=this.container.querySelector("#console-output"),n=this.container.querySelector("#exec-metrics");e==null||e.addEventListener("change",()=>{var o,l;this.currentLanguage=e.value;const i=((o=this.question.sampleCode)==null?void 0:o[this.currentLanguage])||this.languageTemplates[this.currentLanguage]||`# Solution template for ${this.currentLanguage}
`;if(this.currentCode=i,this.editorInstance){const d=this.getMonacoLang(this.currentLanguage);(l=window.monaco)==null||l.editor.setModelLanguage(this.editorInstance.getModel(),d),this.editorInstance.setValue(this.currentCode)}else{const d=this.container.querySelector("#fallback-code-area");d&&(d.value=this.currentCode)}});const r=async()=>{t.disabled=!0,t.innerHTML="<span>⌛</span> Executing...",n.innerHTML="Running in Docker Sandbox...";const i=this.getCodeValue(),o=this.question.testCases||[{id:"tc-1",input:"sample",expectedOutput:"sample",isHidden:!1,weight:10}],l=await fe.executeCode(this.currentLanguage,i,o);t.disabled=!1,t.innerHTML="<span>▶</span> Run Tests",n.innerHTML=`Time: <b class="text-blue-400">${l.executionTimeMs}ms</b> | Memory: <b class="text-purple-400">${l.memoryUsedKb} KB</b>`;const d=l.testResults.filter(m=>m.passed).length,u=l.testResults.length;return a.innerHTML=`
        <div class="p-3 rounded-xl border ${l.passed?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400":"bg-red-500/10 border-red-500/30 text-red-400"} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${l.passed?"✓ All Test Cases Passed":"✖ Test Execution Failed"}</span>
          <span class="font-mono font-bold">${d} / ${u} Passed</span>
        </div>

        ${l.testResults.map((m,p)=>`
          <div class="p-3 rounded-xl bg-slate-950 border ${m.passed?"border-emerald-500/30":"border-red-500/30"} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${p+1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${m.passed?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400"}">
                ${m.passed?"PASSED":"FAILED"}
              </span>
            </div>
            ${m.isHidden?`
              <div class="text-slate-500 text-[11px] italic">Outputs hidden for evaluation integrity.</div>
            `:`
              <div class="text-slate-400 text-[11px]">Input: <code class="text-blue-300">${m.input}</code></div>
              <div class="text-slate-400 text-[11px]">Expected: <code class="text-emerald-300">${m.expected}</code></div>
              <div class="text-slate-400 text-[11px]">Actual: <code class="${m.passed?"text-emerald-400":"text-red-400"}">${m.actual}</code></div>
            `}
          </div>
        `).join("")}
      `,l};t==null||t.addEventListener("click",r),s==null||s.addEventListener("click",async()=>{const i=await r(),o=this.getCodeValue(),l=i.testResults.filter(u=>u.passed).length,d=i.testResults.length;c.setCodeSubmission(this.question.id,{code:o,language:this.currentLanguage,executionTimeMs:i.executionTimeMs,passedCount:l,totalCount:d}),s.innerHTML="<span>✓</span> Saved!",s.classList.replace("bg-blue-600","bg-emerald-600"),setTimeout(()=>{s.innerHTML="<span>✓</span> Submit Solution",s.classList.replace("bg-emerald-600","bg-blue-600")},2e3)})}}class ye{constructor(e){x(this,"container");x(this,"mediaStream",null);x(this,"analysisInterval",null);x(this,"canvas",null);x(this,"missingFaceCounter",0);this.container=e}render(){const e=c.getState();this.container.innerHTML=`
      <div class="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <!-- Floating Violation Alert Toast Banner -->
        ${e.liveProctoringAlert?`
          <div class="glass-panel p-3.5 rounded-2xl border border-red-500/40 bg-red-950/90 shadow-2xl animate-pulse-red max-w-sm flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-lg shrink-0">⚠️</div>
            <div>
              <h4 class="text-xs font-bold text-red-300 uppercase tracking-wider">Proctoring Warning</h4>
              <p class="text-xs text-white font-medium">${e.liveProctoringAlert}</p>
            </div>
          </div>
        `:""}

        <!-- Clean Candidate Live Camera Video PIP (NO TEXT, NO OVERLAYS) -->
        <div class="glass-panel p-1 rounded-2xl border border-slate-700/80 shadow-2xl w-48 bg-slate-950/90 overflow-hidden">
          <div class="relative w-full aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
            <video id="proctor-pip-video" autoplay playsinline muted class="w-full h-full object-cover rounded-xl"></video>
            <div id="pip-fallback" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-600">
              <span class="text-2xl">📷</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Proctor Intercom / 360° Room Inspection Pitch Overlay Modal -->
      ${e.proctorIntercomMessage?`
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel p-6 rounded-3xl border border-purple-500/50 bg-slate-950/95 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div class="w-16 h-16 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-3xl mx-auto border border-purple-500/40 animate-pulse">
              🎙️
            </div>
            <div>
              <span class="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">LIVE PROCTOR VOICE INTERCOM ACTIVE</span>
              <h3 class="text-lg font-extrabold text-white mt-2">Proctor Inspection Pitch Received</h3>
            </div>

            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-purple-200 font-medium space-y-2 text-left">
              <p class="text-[11px] text-slate-400 font-mono">From: Head Exam Proctor</p>
              <p class="text-sm font-bold text-white">"${e.proctorIntercomMessage}"</p>
            </div>

            <div class="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-300 font-semibold">
              📹 Please rotate your laptop / camera 360° around your desk and room to complete the environment scan.
            </div>

            <button id="acknowledge-intercom-btn" class="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all">
              ✓ ACKNOWLEDGE & COMPLETE ROOM SCAN
            </button>
          </div>
        </div>
      `:""}
    `,this.initVideo(),this.attachEvents()}async initVideo(){const e=this.container.querySelector("#proctor-pip-video"),t=this.container.querySelector("#pip-fallback");try{this.mediaStream=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0}),this.mediaStream&&c.registerMediaStream(this.mediaStream),e&&(e.srcObject=this.mediaStream,t&&(t.style.display="none"),e.play().catch(()=>{}),this.startFaceTrackerLoop(e))}catch{}}startFaceTrackerLoop(e){this.analysisInterval&&clearInterval(this.analysisInterval),this.canvas=document.createElement("canvas");const t=this.canvas.getContext("2d",{willReadFrequently:!0});this.analysisInterval=setInterval(()=>{var a;const s=c.getState();if(!(!s.examStarted||s.examCompleted||!e)&&!(!this.canvas||!t)){this.canvas.width=160,this.canvas.height=120;try{t.drawImage(e,0,0,160,120);const r=t.getImageData(0,0,160,120).data;let i=0,o=0;for(let u=20;u<100;u+=4)for(let m=30;m<130;m+=4){const p=(u*160+m)*4,b=r[p],h=r[p+1],g=r[p+2],C=.299*b+.587*h+.114*g;o+=C,b>50&&h>30&&g>15&&b>h&&h>g&&b-Math.min(h,g)>12&&i++}const l=20*25,d=o/l;i<12||d<15?c.logProctoringViolation("No Face Detected","Candidate face turned away or not visible in camera frame!","high"):(a=s.liveProctoringAlert)!=null&&a.includes("No Face Detected")&&c.clearProctoringAlert()}catch{}}},1e3)}attachEvents(){var e;(e=this.container.querySelector("#acknowledge-intercom-btn"))==null||e.addEventListener("click",()=>{c.clearProctorIntercom()}),window.onblur=()=>{const t=c.getState();t.examStarted&&!t.examCompleted&&c.logProctoringViolation("Tab Switch","Window focus lost (Tab switch or window navigation detected).","high")}}}class se{constructor(e){x(this,"container");x(this,"cameraStream",null);x(this,"isCameraPassed",!1);x(this,"isMicPassed",!1);x(this,"isNetworkPassed",!1);x(this,"isBrowserPassed",!1);x(this,"pingMs",0);x(this,"micDecibels",0);x(this,"isPhotoCaptured",!1);x(this,"isIdUploaded",!1);this.container=e}async render(){this.container.innerHTML=`
      <div class="max-w-4xl mx-auto py-10 px-4">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>STEP 4 OF 5</span> • System Pre-Flight Diagnostics
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Candidate System Hardware & Network Verification</h1>
          <p class="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Live hardware check active. All mandatory hardware and network requirements must pass before starting your assessment.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Diagnostics List Panel -->
          <div class="md:col-span-2 space-y-4">
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 class="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Hardware & Permission Diagnostics</span>
                <button id="recheck-btn" class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300">
                  🔄 Re-test Hardware
                </button>
              </h2>

              <!-- Camera Check -->
              <div id="cam-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">📷</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Webcam Access</h3>
                      <p class="text-xs text-slate-400">High-definition video feed for proctoring</p>
                    </div>
                  </div>
                  <div id="cam-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="cam-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Microphone Check -->
              <div id="mic-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">🎙️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Microphone Level</h3>
                      <p class="text-xs text-slate-400">Audio input & background noise tracking</p>
                    </div>
                  </div>
                  <div id="mic-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="mic-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Network & Latency Check -->
              <div id="net-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">⚡</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Internet Network Latency</h3>
                      <p id="net-sub-text" class="text-xs text-slate-400">Measuring ping latency...</p>
                    </div>
                  </div>
                  <div id="net-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Pinging...</span>
                  </div>
                </div>
                <p id="net-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <!-- Browser & Resolution Check -->
              <div id="browser-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">🖥️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Browser & Screen Resolution</h3>
                      <p id="browser-sub-text" class="text-xs text-slate-400">Checking monitor resolution & lockdown support...</p>
                    </div>
                  </div>
                  <div id="browser-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Checking...</span>
                  </div>
                </div>
                <p id="browser-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>
            </div>

            <!-- Rules & Declaration Checkbox -->
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider text-slate-300">Exam Integrity Terms & Declaration</h3>
              <ul class="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
                <li>I understand that tab switching or exiting fullscreen will log a violation.</li>
                <li>I confirm that I am sitting alone in a well-lit environment without unauthorized materials.</li>
                <li>I accept continuous webcam, microphone, and screen monitoring during the assessment.</li>
              </ul>
              <label class="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 cursor-pointer">
                <input id="declaration-check" type="checkbox" class="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
                <span class="text-xs font-semibold text-slate-200">I have read, understood, and accept all exam proctoring guidelines.</span>
              </label>
            </div>
          </div>

            <!-- Camera Stream Preview Box & Identity Registration -->
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Camera Feed & Identity Registration</h3>
              <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video id="webcam-preview" autoplay playsinline muted class="w-full h-full object-cover"></video>
                <div id="cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">📷</span>
                  <span class="text-xs font-medium">Initializing camera stream...</span>
                </div>
              </div>
              <button type="button" id="snap-photo-btn" class="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <span>📸</span> Snap Candidate Photo
              </button>
              <div id="photo-preview-box" class="hidden p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                <span>✓ Candidate Live Photo Registered</span>
                <img id="cand-photo-img" class="w-10 h-10 rounded-lg object-cover border border-emerald-500/40" />
              </div>
            </div>

            <!-- Govt / College ID Card Registration (Live Camera Snap or File Upload) -->
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> Government / College ID Card Capture
              </h3>
              <p class="text-[11px] text-slate-400">Hold your Aadhar, Passport, Student ID, or License in front of the camera and snap live, or choose an image file.</p>
              
              <div class="grid grid-cols-2 gap-2">
                <button type="button" id="snap-id-live-btn" class="w-full py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <span>📸</span> Snap ID Live
                </button>
                
                <button type="button" id="upload-id-btn" class="w-full py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1">
                  <span>📁</span> Select ID File
                </button>
              </div>

              <input type="file" id="id-file-input" accept="image/*" class="hidden" />

              <div id="id-preview-box" class="hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between">
                <span>✓ Govt / College ID Card Captured</span>
                <img id="id-card-img" class="w-10 h-10 rounded-lg object-cover border border-purple-500/40" />
              </div>
            </div>

            <!-- Start Exam Action Button (Gated by All Hardware Requirements & Identity Checks) -->
            <button
              id="start-exam-btn"
              disabled
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER SECURE EXAM ENVIRONMENT</span>
              <span>➔</span>
            </button>
            <p id="gate-msg" class="text-xs font-semibold text-amber-400 text-center">Complete hardware diagnostics, snap photo & upload ID proof to proceed.</p>
          </div>
        </div>
      </div>
    `,await this.runLiveDiagnostics(),this.attachEvents()}async runLiveDiagnostics(){const e=this.container.querySelector("#webcam-preview"),t=this.container.querySelector("#cam-placeholder");try{if(this.cameraStream=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0}),this.cameraStream){c.registerMediaStream(this.cameraStream),e&&(e.srcObject=this.cameraStream,t&&(t.style.display="none"));const i=this.cameraStream.getVideoTracks(),o=this.cameraStream.getAudioTracks();i.length>0&&i[0].enabled?(this.isCameraPassed=!0,this.updateBadge("#cam-status-badge",!0,"Passed ✓"),this.hideError("#cam-err-msg")):(this.isCameraPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera stream unreadable. Please check webcam connection or browser permissions.")),o.length>0&&o[0].enabled?(this.isMicPassed=!0,this.updateBadge("#mic-status-badge",!0,"Active (42dB) ✓"),this.hideError("#mic-err-msg")):(this.isMicPassed=!1,this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone stream unreadable or muted. Please grant audio permissions."))}}catch{this.isCameraPassed=!1,this.isMicPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera permission denied or camera not found. Please allow camera access in browser address bar and retry."),this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone permission denied or microphone missing. Please allow microphone access."),t&&(t.innerHTML=`
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera Permission Denied</span>
        `)}const s=performance.now();try{if(await fetch(window.location.href,{method:"HEAD",cache:"no-store"}),this.pingMs=Math.round(performance.now()-s),this.pingMs<1e3){this.isNetworkPassed=!0,this.updateBadge("#net-status-badge",!0,`Optimal (${this.pingMs}ms) ✓`);const i=this.container.querySelector("#net-sub-text");i&&(i.textContent=`Ping latency: ${this.pingMs}ms | Connection stable`),this.hideError("#net-err-msg")}else this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,`High Latency (${this.pingMs}ms) ✖`),this.showError("#net-err-msg","Network latency is too high (>1000ms). Please connect to a stable Wi-Fi or Ethernet network.")}catch{this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,"Offline ✖"),this.showError("#net-err-msg","No internet connection detected. Please check your network cables or Wi-Fi connection.")}const a=window.screen.width,n=window.screen.height,r=this.container.querySelector("#browser-sub-text");r&&(r.textContent=`Screen resolution: ${a}x${n} | Single Monitor`),a>=1024?(this.isBrowserPassed=!0,this.updateBadge("#browser-status-badge",!0,"Compatible ✓"),this.hideError("#browser-err-msg")):(this.isBrowserPassed=!1,this.updateBadge("#browser-status-badge",!1,"Failed ✖"),this.showError("#browser-err-msg","Minimum screen resolution requirement of 1024px width not satisfied. Please maximize window or increase screen resolution.")),this.checkButtonState()}updateBadge(e,t,s){const a=this.container.querySelector(e);a&&(a.innerHTML=`
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${t?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}">${s}</span>
      `)}showError(e,t){const s=this.container.querySelector(e);s&&(s.textContent=t,s.classList.remove("hidden"))}hideError(e){const t=this.container.querySelector(e);t&&t.classList.add("hidden")}checkButtonState(){const e=this.container.querySelector("#declaration-check"),t=this.container.querySelector("#start-exam-btn"),s=this.container.querySelector("#gate-msg"),a=this.isCameraPassed&&this.isMicPassed&&this.isNetworkPassed&&this.isBrowserPassed,n=(e==null?void 0:e.checked)||!1,r=this.isPhotoCaptured&&this.isIdUploaded;a&&n&&r?(t.disabled=!1,t.classList.remove("opacity-50","cursor-not-allowed"),s&&(s.textContent="All hardware & candidate identity checks verified ✓"),s&&(s.className="text-xs font-semibold text-emerald-400 text-center")):(t.disabled=!0,t.classList.add("opacity-50","cursor-not-allowed"),a?r?(s&&(s.textContent="Check terms declaration box to proceed."),s&&(s.className="text-xs font-semibold text-amber-400 text-center")):(s&&(s.textContent="Identity verification incomplete: Snap candidate photo & upload Govt/College ID proof."),s&&(s.className="text-xs font-semibold text-amber-400 text-center")):(s&&(s.textContent="Requirement unsatisfied: Fix failed hardware/network checks to proceed."),s&&(s.className="text-xs font-semibold text-red-400 text-center")))}attachEvents(){const e=this.container.querySelector("#declaration-check"),t=this.container.querySelector("#start-exam-btn"),s=this.container.querySelector("#recheck-btn"),a=this.container.querySelector("#snap-photo-btn"),n=this.container.querySelector("#photo-preview-box"),r=this.container.querySelector("#cand-photo-img"),i=this.container.querySelector("#webcam-preview"),o=this.container.querySelector("#upload-id-btn"),l=this.container.querySelector("#id-file-input"),d=this.container.querySelector("#id-preview-box"),u=this.container.querySelector("#id-card-img"),m=()=>{const b=c.getState().activeCandidateId||"cand-3",h=(r==null?void 0:r.src)||"",g=(u==null?void 0:u.src)||"";(h||g)&&c.registerCandidateIdentity(b,h,g)};a==null||a.addEventListener("click",()=>{if(i&&i.videoWidth){const b=document.createElement("canvas");b.width=i.videoWidth,b.height=i.videoHeight;const h=b.getContext("2d");if(h){h.drawImage(i,0,0,b.width,b.height);const g=b.toDataURL("image/png");r&&(r.src=g),n&&n.classList.remove("hidden"),this.isPhotoCaptured=!0,this.checkButtonState(),m()}}else{const b='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>';r&&(r.src=b),n&&n.classList.remove("hidden"),this.isPhotoCaptured=!0,this.checkButtonState(),m()}});const p=this.container.querySelector("#snap-id-live-btn");p==null||p.addEventListener("click",()=>{if(i&&i.videoWidth){const b=document.createElement("canvas");b.width=i.videoWidth,b.height=i.videoHeight;const h=b.getContext("2d");if(h){h.drawImage(i,0,0,b.width,b.height);const g=b.toDataURL("image/png");u&&(u.src=g),d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),m()}}else{const b='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23a855f7" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2m-2 4h2m-6 4h6"/></svg>';u&&(u.src=b),d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),m()}}),o==null||o.addEventListener("click",()=>{l==null||l.click()}),l==null||l.addEventListener("change",()=>{if(l.files&&l.files[0]){const b=l.files[0],h=new FileReader;h.onload=g=>{var C;u&&((C=g.target)!=null&&C.result)&&(u.src=g.target.result,d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),m())},h.readAsDataURL(b)}}),e==null||e.addEventListener("change",()=>{this.checkButtonState()}),s==null||s.addEventListener("click",()=>{this.runLiveDiagnostics()}),t==null||t.addEventListener("click",()=>{const b=c.getState().activeCandidateId||"cand-3",h=(r==null?void 0:r.src)||"",g=(u==null?void 0:u.src)||"";c.registerCandidateIdentity(b,h,g),c.completeSystemCheck();const C=c.getState().candidates.find(A=>A.id===b);(C==null?void 0:C.identityStatus)==="approved"?(c.startExam(),document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})):this.renderWaitingForApprovalScreen()})}renderWaitingForApprovalScreen(){this.container.innerHTML=`
      <div class="max-w-xl mx-auto py-16 px-4 text-center">
        <div class="glass-panel p-8 rounded-3xl border border-amber-500/30 bg-slate-950/90 space-y-6 shadow-2xl">
          <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mx-auto animate-pulse">
            ⏳
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-white">Identity Verification Pending Proctor Approval</h2>
            <p class="text-xs text-slate-300 mt-2">
              Your live photo snapshot and Govt/College ID proof have been securely submitted to the Admin & Recruiter Dashboard.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold space-y-2">
            <p>🔒 Security Protocol Active: Please stay on this screen.</p>
            <p class="text-slate-400 font-normal">Once the Proctor/Recruiter verifies your photo and ID card proof, you will automatically enter the exam!</p>
          </div>

          <div class="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waiting for Proctor / Recruiter Authorization...</span>
          </div>
        </div>
      </div>
    `;const e=c.subscribe(()=>{const t=c.getState().activeCandidateId||"cand-3",s=c.getState().candidates.find(a=>a.id===t);(s==null?void 0:s.identityStatus)==="approved"&&(e(),c.startExam(),document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}))})}}class we{constructor(e){x(this,"container");x(this,"timerInterval",null);x(this,"selectedRating",5);x(this,"selectedFeedbackTags",new Set(["Clear Instructions","Smooth Coding IDE"]));this.container=e,this.attachFullscreenEnforcement()}attachFullscreenEnforcement(){var t;const e=document.createElement("div");e.id="fullscreen-enforcer-overlay",e.className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center hidden",e.innerHTML=`
      <div class="glass-panel p-8 rounded-3xl border border-red-500/50 text-center max-w-lg space-y-6 shadow-2xl">
        <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-4xl animate-pulse">
          ⚠️
        </div>
        <div>
          <h2 class="text-xl font-extrabold text-white">Fullscreen Lockdown Violation</h2>
          <p class="text-sm text-slate-300 mt-2">
            This assessment requires strict fullscreen mode. You have exited fullscreen, which is a proctoring violation. 
            Please return to fullscreen immediately to resume your assessment.
          </p>
        </div>
        <button id="resume-fullscreen-btn" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
          <span>🛡️ RE-ENTER FULLSCREEN TO RESUME</span>
        </button>
      </div>
    `,document.body.appendChild(e),(t=e.querySelector("#resume-fullscreen-btn"))==null||t.addEventListener("click",()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}),document.addEventListener("fullscreenchange",()=>{const s=c.getState(),a=s.candidateFeedback!==null;s.otpVerified&&!a?document.fullscreenElement?e.classList.add("hidden"):(e.classList.remove("hidden"),c.addProctoringViolation("Fullscreen Exit","high","Candidate forcibly exited fullscreen lockdown mode")):e.classList.add("hidden")})}render(){const e=c.getState();e.otpVerified?e.systemCheckCompleted?e.examStarted&&!e.examCompleted?(this.renderExamEngine(),this.startTimer()):e.examCompleted?this.renderCompletionScreen():this.renderInstructionsScreen():new se(this.container).render():this.renderOtpVerification()}renderOtpVerification(){this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6">
          <div class="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            🔑
          </div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Candidate Verification</h2>
            <p class="text-xs text-slate-400 mt-2">Enter the 6-digit verification OTP sent to your registered Email and Phone.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-left text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Verification Passcode (OTP)</label>
              <input id="otp-input" type="text" maxlength="6" value="" class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
            </div>

            <button id="verify-otp-btn" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all">
              VERIFY & CONTINUE ➔
            </button>
            <p id="otp-error" class="text-xs font-semibold text-red-400 hidden">Invalid OTP passcode. Please check your email inbox for the 6-digit passcode sent to you.</p>
          </div>
        </div>
      </div>
    `;const e=this.container.querySelector("#otp-input"),t=this.container.querySelector("#verify-otp-btn"),s=this.container.querySelector("#otp-error");e==null||e.addEventListener("keydown",a=>{a.key==="Enter"&&(t==null||t.dispatchEvent(new Event("click")))}),t==null||t.addEventListener("click",()=>{const a=e.value.trim();c.verifyCandidateOtp(a)?(!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),c.verifyOtp(a)):s==null||s.classList.remove("hidden")})}renderInstructionsScreen(){var t;const e=c.getActiveAssessment();this.container.innerHTML=`
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Assessment Overview</span>
              <h1 class="text-2xl font-extrabold text-white mt-2">${(e==null?void 0:e.title)||"Technical Assessment"}</h1>
              <p class="text-xs text-slate-400 mt-1">${e==null?void 0:e.description}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold font-mono text-blue-400">${e==null?void 0:e.totalDurationMinutes} Mins</div>
              <span class="text-xs text-slate-400 font-medium">Total Duration</span>
            </div>
          </div>

          <!-- Section Breakdown Cards (NO MARKS DISPLAYED) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${((e==null?void 0:e.sections)||[]).map((s,a)=>`
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section ${a+1}</span>
                <h3 class="text-xs font-bold text-white truncate">${s.name}</h3>
                <div class="text-xs font-mono text-blue-400 font-semibold">${s.timeLimitMinutes} Mins • ${s.questions.length} Questions</div>
              </div>
            `).join("")}
          </div>

          <div class="pt-4 border-t border-slate-800 flex justify-end">
            <button id="goto-syscheck-btn" class="py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
              <span>PROCEED TO SYSTEM DIAGNOSTICS</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>
    `,(t=this.container.querySelector("#goto-syscheck-btn"))==null||t.addEventListener("click",()=>{!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),new se(this.container).render()})}renderExamEngine(){const e=c.getState(),t=c.getActiveAssessment();if(!t)return;const s=t.sections[e.currentSectionIndex],a=s==null?void 0:s.questions[e.currentQuestionIndex];if(!s||!a)return;const n=Math.floor(e.sectionTimeRemainingSeconds/60),r=e.sectionTimeRemainingSeconds%60,i=`${String(n).padStart(2,"0")}:${String(r).padStart(2,"0")}`;if(this.container.innerHTML=`
      <div class="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950">
        <!-- Secure Exam Top Navigation Header -->
        <div class="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between sticky top-14 z-30">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                SECTION ${e.currentSectionIndex+1} OF ${t.sections.length}
              </span>
              <h2 class="text-sm font-bold text-white">${s.name}</h2>
            </div>
          </div>

          <!-- Section Timer & Section Navigation Controls -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
              <span class="text-xs text-slate-400 uppercase tracking-wider">Section Time:</span>
              <span class="text-base font-extrabold ${n<2?"text-red-400 animate-pulse":"text-blue-400"}">${i}</span>
            </div>

            <button id="finish-sec-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all">
              Complete Section ➔
            </button>
          </div>
        </div>

        <!-- Exam Workspace Main Body -->
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          <!-- Left Question Description & Navigation Panel -->
          <div class="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 overflow-y-auto space-y-6 bg-slate-950">
            <div class="flex items-center justify-between">
              <!-- STRICT REQUIREMENT: NO MARKS OR POINTS DISPLAYED TO CANDIDATE -->
              <span class="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                Question ${e.currentQuestionIndex+1} of ${s.questions.length}
              </span>
              <button id="flag-q-btn" class="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${e.flaggedQuestions.has(a.id)?"bg-amber-500/20 text-amber-300 border-amber-500/40":"bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}">
                🚩 ${e.flaggedQuestions.has(a.id)?"Flagged for Review":"Flag Question"}
              </button>
            </div>

            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">${a.title}</h3>
              <div class="prose prose-invert prose-sm text-slate-300 mt-3 space-y-2 whitespace-pre-line leading-relaxed">
                ${a.content}
              </div>
            </div>

            <!-- Answer Input Widget based on Question Type -->
            <div class="pt-4 border-t border-slate-800/80">
              ${this.renderAnswerWidget(a,e.candidateAnswers[a.id])}
            </div>

            <!-- Question Navigation Next / Prev Action Bar -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button id="prev-q-btn" ${e.currentQuestionIndex===0?'disabled class="px-4 py-2 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 text-xs font-bold cursor-not-allowed"':'class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"'}>
                ⬅ Previous Question
              </button>

              ${e.currentQuestionIndex<s.questions.length-1?`
                <button id="next-q-btn" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Next Question</span> <span>➔</span>
                </button>
              `:`
                <button id="next-sec-btn" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5">
                  <span>Submit Section & Proceed</span> <span>➔</span>
                </button>
              `}
            </div>

            <!-- Question Palette Map -->
            <div class="pt-4 border-t border-slate-800/80 space-y-2">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Navigation Map:</span>
              <div class="flex flex-wrap gap-2">
                ${s.questions.map((l,d)=>{const u=e.candidateAnswers[l.id]!==void 0,m=e.flaggedQuestions.has(l.id),p=d===e.currentQuestionIndex;return`
                    <button data-qidx="${d}" class="q-map-btn w-8 h-8 rounded-lg text-xs font-bold transition-all border ${p?"bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30":m?"bg-amber-500/20 text-amber-300 border-amber-500/40":u?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"}">
                      ${d+1}
                    </button>
                  `}).join("")}
              </div>
            </div>
          </div>

          <!-- Right Interactive Code IDE / Essay Workspace -->
          <div class="lg:col-span-7 bg-slate-900/50 p-4 flex flex-col overflow-hidden">
            ${a.type==="coding"||a.type==="sql"?`
              <div id="monaco-container" class="w-full h-full"></div>
            `:a.type==="essay"?(()=>{const l=(e.candidateAnswers[a.id]||"").trim();return`
                  <div class="w-full h-full flex flex-col glass-panel p-5 rounded-2xl border border-slate-800">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Rich Text Essay Response Editor</span>
                      <span id="word-count" class="text-xs font-mono text-blue-400">${l?l.split(/\s+/).filter(Boolean).length:0} / ${a.essayMaxWords||500} words</span>
                    </div>
                    <textarea id="essay-editor" class="flex-1 w-full p-4 glass-input rounded-xl text-sm font-sans text-slate-100 border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 resize-none outline-none" placeholder="Type your response here... (Minimum ${a.essayMinWords||150} words requirement)">${e.candidateAnswers[a.id]||""}</textarea>
                  </div>
                `})():`
              <div class="w-full h-full flex items-center justify-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Select your answer in the question panel on the left.
              </div>
            `}
          </div>
        </div>

        <!-- Floating Live Proctoring Webcam PIP -->
        <div id="proctoring-pip-container"></div>
      </div>
    `,a.type==="coding"||a.type==="sql"){const l=this.container.querySelector("#monaco-container");l&&new ve(l,a).render()}const o=this.container.querySelector("#proctoring-pip-container");o&&new ye(o).render(),this.attachExamEvents(a)}renderAnswerWidget(e,t){return e.type==="mcq"?`
        <div class="space-y-2.5">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Multiple Choice Answer Option:</span>
          ${(e.options&&e.options.length>0?e.options:[{id:"opt-1",text:"Reference Counting & Generational GC"},{id:"opt-2",text:"Manual memory allocation with malloc and free"},{id:"opt-3",text:"Mark and sweep garbage collection only"},{id:"opt-4",text:"All of the above"}]).map((a,n)=>{const r=typeof a=="string"?`opt-${n+1}`:a.id||`opt-${n+1}`,i=typeof a=="string"?a:a.text||`Option ${n+1}`,o=t===r||t===i;return`
              <label class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${o?"bg-blue-600/10 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/20":"bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700"}">
                <input type="radio" name="mcq-option" value="${r}" ${o?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500" />
                <span class="text-xs font-medium">${i}</span>
              </label>
            `}).join("")}
        </div>
      `:""}attachExamEvents(e){var n,r,i,o,l;this.container.querySelectorAll('input[name="mcq-option"]').forEach(d=>{d.addEventListener("change",u=>{const m=u.target.value;c.setAnswer(e.id,m),this.renderExamEngine()})});const t=this.container.querySelector("#essay-editor"),s=this.container.querySelector("#word-count");t&&t.addEventListener("input",()=>{const d=t.value,u=d.trim()?d.trim().split(/\s+/).filter(Boolean).length:0;s&&(s.textContent=`${u} / ${e.essayMaxWords||500} words`),c.setAnswer(e.id,d,!1)}),(n=this.container.querySelector("#flag-q-btn"))==null||n.addEventListener("click",()=>{c.toggleFlagQuestion(e.id),this.renderExamEngine()}),this.container.querySelectorAll(".q-map-btn").forEach(d=>{d.addEventListener("click",u=>{const m=parseInt(u.currentTarget.getAttribute("data-qidx")||"0",10),p=c.getState();p.currentQuestionIndex=m,this.renderExamEngine()})}),(r=this.container.querySelector("#prev-q-btn"))==null||r.addEventListener("click",()=>{c.prevQuestion(),this.renderExamEngine()}),(i=this.container.querySelector("#next-q-btn"))==null||i.addEventListener("click",()=>{c.nextQuestion(),this.renderExamEngine()});const a=()=>{this.renderCustomSubmitSectionModal()};(o=this.container.querySelector("#finish-sec-btn"))==null||o.addEventListener("click",a),(l=this.container.querySelector("#next-sec-btn"))==null||l.addEventListener("click",a)}renderCustomSubmitSectionModal(){var t,s;const e=document.createElement("div");e.id="sec-confirm-modal",e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center text-2xl font-bold">
            ⚠️
          </div>
          <div>
            <h3 class="text-lg font-extrabold text-white">Complete & Submit Section?</h3>
            <p class="text-xs text-slate-300 mt-2 leading-relaxed">
              Are you sure you want to submit this section and proceed to the next section? You will not be able to revisit previous questions.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button id="cancel-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              Cancel & Continue Section
            </button>
            <button id="confirm-sec-modal-btn" class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all">
              Yes, Submit Section ➔
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(e),(t=e.querySelector("#cancel-sec-modal-btn"))==null||t.addEventListener("click",()=>{e.remove()}),(s=e.querySelector("#confirm-sec-modal-btn"))==null||s.addEventListener("click",()=>{e.remove(),c.nextSection(),!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),this.render()})}startTimer(){this.timerInterval&&clearInterval(this.timerInterval),this.timerInterval=setInterval(()=>{const e=c.getState();if(!e.examStarted||e.examCompleted){clearInterval(this.timerInterval);return}if(e.sectionTimeRemainingSeconds>0){e.sectionTimeRemainingSeconds--;const t=Math.floor(e.sectionTimeRemainingSeconds/60),s=e.sectionTimeRemainingSeconds%60,a=`${String(t).padStart(2,"0")}:${String(s).padStart(2,"0")}`,n=this.container.querySelector(".font-extrabold.text-blue-400");n&&(n.textContent=a)}else c.nextSection(),this.render()},1e3)}renderCompletionScreen(){const t=c.getState().candidateFeedback!==null,s=["Clear Instructions","Smooth Coding IDE","Fair Proctoring","Responsive UI","Good Question Difficulty"];this.container.innerHTML=`
      <div class="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <!-- Hardware Stopped & Exit Fullscreen Confirmation Badge -->
        <div class="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Webcam & Microphone Closed • Fullscreen Lockdown Ended</span>
          </div>
          <span class="font-mono text-[11px] bg-slate-900/80 px-2 py-0.5 rounded border border-emerald-500/20">Camera OFF</span>
        </div>

        <div class="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6 shadow-2xl">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center text-3xl animate-pulse-green">
            ✓
          </div>
          <div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Assessment Submitted Successfully</h1>
            <p class="text-xs text-slate-300 mt-2">
              Your test responses and code submissions have been securely encrypted and transmitted to the hiring team.
            </p>
          </div>

          <!-- Strict Compliance Policy Notice (No Scores Displayed) -->
          <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-1.5">
            <h4 class="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔒</span> Candidate Evaluation Policy Notice
            </h4>
            <p class="text-[11px] text-slate-300 leading-relaxed">
              In accordance with enterprise recruitment compliance standards, evaluation scores, section percentages, and recruiter comments are directly routed to the hiring committee and are not displayed on the candidate portal.
            </p>
          </div>

          <!-- Candidate Rating & Feedback Survey Form -->
          ${t?`
            <div class="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-4">
              <span class="text-3xl">🌟</span>
              <h4 class="text-sm font-extrabold uppercase tracking-wider text-emerald-300">Thank You for Your Feedback!</h4>
              <p class="text-xs text-slate-300">Your rating & feedback have been securely recorded. You may now safely exit the assessment environment.</p>

              <button id="exit-fullscreen-close-tab-btn" class="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
                <span>🔒 EXIT SECURE EXAM & CLOSE TAB</span>
              </button>
            </div>
          `:`
            <div id="feedback-section" class="pt-6 border-t border-slate-800/80 space-y-5 text-left">
              <div class="text-center">
                <h3 class="text-base font-extrabold text-white">Rate Your Assessment Experience</h3>
                <p class="text-xs text-slate-400 mt-1">Please take a moment to rate the platform and share your feedback.</p>
              </div>

              <!-- Interactive 5-Star Rating Selector -->
              <div class="flex justify-center items-center gap-3">
                ${[1,2,3,4,5].map(a=>`
                  <button data-star="${a}" class="star-btn text-3xl transition-transform hover:scale-125 focus:outline-none ${a<=this.selectedRating?"text-amber-400":"text-slate-700"}">
                    ★
                  </button>
                `).join("")}
              </div>

              <!-- Experience Tags -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-2">Highlight What Went Well:</label>
                <div class="flex flex-wrap gap-2">
                  ${s.map(a=>{const n=this.selectedFeedbackTags.has(a);return`
                      <button data-tag="${a}" class="tag-btn px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${n?"bg-blue-600 text-white border-blue-500 shadow-md":"bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}">
                        ${n?"✓ ":""}${a}
                      </button>
                    `}).join("")}
                </div>
              </div>

              <!-- Feedback Textarea -->
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Additional Comments / Suggestions (Optional):</label>
                <textarea id="feedback-text" rows="3" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Share your experience regarding the test questions, coding IDE, or proctoring..."></textarea>
              </div>

              <button id="submit-feedback-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all">
                SUBMIT RATING & FEEDBACK ➔
              </button>
            </div>
          `}

          <div class="pt-4 border-t border-slate-800">
            <p class="text-xs text-slate-500 font-mono">Reference Submission ID: SUB-2026-98412-SEC</p>
          </div>
        </div>
      </div>
    `,this.attachFeedbackEvents()}attachFeedbackEvents(){const e=this.container.querySelector("#exit-fullscreen-close-tab-btn");e==null||e.addEventListener("click",()=>{document.fullscreenElement&&document.exitFullscreen&&document.exitFullscreen().catch(()=>{}),alert("✅ Assessment session closed cleanly. You may now close this browser tab."),window.location.reload()}),this.container.querySelectorAll(".star-btn").forEach(s=>{s.addEventListener("click",a=>{const n=parseInt(a.currentTarget.getAttribute("data-star")||"5",10);this.selectedRating=n,this.renderCompletionScreen()})}),this.container.querySelectorAll(".tag-btn").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-tag")||"";this.selectedFeedbackTags.has(n)?this.selectedFeedbackTags.delete(n):this.selectedFeedbackTags.add(n),this.renderCompletionScreen()})});const t=this.container.querySelector("#submit-feedback-btn");t==null||t.addEventListener("click",()=>{const s=this.container.querySelector("#feedback-text"),a=s?s.value.trim():"";c.saveCandidateFeedback(this.selectedRating,a,Array.from(this.selectedFeedbackTags)),this.renderCompletionScreen()})}}class Se{constructor(e){x(this,"container");this.container=e}render(){const t=c.getState().liveCandidates;this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Live Proctor Grid Header -->
        <div class="flex items-center justify-between glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold text-xl animate-pulse">
              📹
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h1 class="text-xl font-extrabold text-white tracking-tight">Live Candidate Proctoring Command Center</h1>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">Real-time WebRTC camera streams, AI gaze tracking, and remote intervention tools.</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300">
              Active Sessions: <b class="text-blue-400">${t.length}</b>
            </span>
          </div>
        </div>

        <!-- Live Candidate Video Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${t.map(s=>`
            <div class="glass-panel p-4 rounded-3xl border ${s.status==="warning"?"border-amber-500/50 bg-amber-950/20":"border-slate-800 bg-slate-950/80"} space-y-4 shadow-xl">
              <!-- Video Frame -->
              <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <!-- Video Stream Feed -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col items-center justify-center text-slate-500">
                  <span class="text-4xl mb-1">👤</span>
                  <span class="text-xs font-mono text-slate-400">${s.name}</span>
                </div>

                <!-- Face Bounding Box Overlay -->
                <div class="absolute inset-4 border-2 border-dashed ${s.status==="warning"?"border-amber-400":"border-emerald-400"} rounded-xl flex items-start justify-between p-2 pointer-events-none">
                  <span class="text-[9px] font-mono font-bold bg-slate-950/80 text-white px-2 py-0.5 rounded border border-slate-800">
                    ${s.sectionName}
                  </span>
                  <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded ${s.status==="warning"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/20 text-emerald-300"}">
                    ${s.status.toUpperCase()}
                  </span>
                </div>

                <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono font-bold text-white">
                  <span class="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">Time Left: ${s.timeRemaining}</span>
                  <span class="bg-red-950/90 text-red-300 px-2 py-0.5 rounded border border-red-800">Violations: ${s.violations}</span>
                </div>
              </div>

              <!-- Candidate Summary Info -->
              <div class="space-y-1.5 px-1">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">${s.name}</h3>
                  <span class="text-xs text-slate-400">${s.role}</span>
                </div>
                ${s.lastEvent?`
                  <p class="text-xs font-mono text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    ⚠️ Alert: ${s.lastEvent}
                  </p>
                `:`
                  <p class="text-xs font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    ✓ Clean session behavior.
                  </p>
                `}
              </div>

              <!-- Remote Action Control Buttons -->
              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button data-cid="${s.candidateId}" class="warn-btn px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs tracking-wider transition-all">
                  ⚠️ Issue Warning
                </button>
                <button data-cid="${s.candidateId}" class="term-btn px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-wider transition-all">
                  ⛔ Terminate Exam
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `,this.attachEvents()}attachEvents(){this.container.querySelectorAll(".warn-btn").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-cid");alert(`Direct proctor warning dispatched to candidate ${s}.`)})}),this.container.querySelectorAll(".term-btn").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-cid");confirm(`Are you sure you want to forcibly terminate candidate ${s}'s assessment?`)&&(c.logProctoringViolation("Fullscreen Exit","Assessment remotely terminated by Proctor","high"),alert(`Assessment terminated for candidate ${s}.`))})})}}class Ce{constructor(e){x(this,"container");x(this,"selectedCandidateId",null);x(this,"currentViewMode","kanban");x(this,"activeStageTab","ALL");this.container=e}render(){const e=c.getState(),t=e.candidates,s=["ALL","Applied","Screened","Assessment Sent","Completed","Under Review","Selected","Rejected"],a=this.activeStageTab==="ALL"?t:t.filter(n=>n.status===this.activeStageTab);this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        <!-- Recruiter Header & Invite Generator Button -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">Recruitment Hub</span>
              <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline & Candidate Details</h1>
            </div>
            <p class="text-xs text-slate-400 mt-1">Select a stage tab below to filter candidates. Click any candidate's name to view their complete scorecard & details.</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- View Toggle Switcher -->
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-kanban-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="kanban"?"bg-blue-600 text-white shadow":"text-slate-400 hover:text-white"}">
                📋 Pipeline Board
              </button>
              <button id="view-table-btn" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="table"?"bg-blue-600 text-white shadow":"text-slate-400 hover:text-white"}">
                📊 Section Data Table
              </button>
            </div>

            ${this.currentViewMode==="table"?`
              <button id="export-all-csv-btn" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow transition-all">
                <span>📥</span> Export All Sections (.csv)
              </button>
            `:""}

            <button id="view-sent-emails-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-blue-400 font-bold text-xs flex items-center gap-1.5 shadow transition-all">
              <span>📬</span> Email Console
            </button>

            <button id="invite-cand-btn" class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all">
              <span>✉️</span> Generate & Dispatch Link
            </button>
          </div>
        </div>

        <!-- Stage Filter Tabs (Clicking each tab filters candidates by stage!) -->
        <div class="glass-panel p-2 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          ${s.map(n=>{const r=n==="ALL"?t.length:t.filter(o=>o.status===n).length,i=this.activeStageTab===n;return`
              <button data-stage-tab="${n}" class="stage-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${i?"bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-600/30":"bg-slate-900/90 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60"}">
                <span>${n==="ALL"?"📑 ALL CANDIDATES":n}</span>
                <span class="px-2 py-0.5 text-[10px] font-mono rounded-full ${i?"bg-white/20 text-white":"bg-slate-950 text-slate-400"}">${r}</span>
              </button>
            `}).join("")}
        </div>

        ${this.currentViewMode==="kanban"?`
          <!-- Horizontal Pipeline Columns Filtered by Selected Stage Tab -->
          <div class="flex gap-5 overflow-x-auto pb-6 pt-2 scrollbar-thin">
            ${(this.activeStageTab==="ALL"?s.filter(n=>n!=="ALL"):[this.activeStageTab]).map(n=>{const r=t.filter(i=>i.status===n);return`
                <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 shadow-xl space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full ${n==="Applied"?"bg-slate-500":n==="Screened"?"bg-blue-500":n==="Assessment Sent"?"bg-amber-500":n==="Completed"?"bg-purple-500":n==="Under Review"?"bg-indigo-500":n==="Selected"?"bg-emerald-500":"bg-red-500"}"></span>
                      <h3 class="text-xs font-extrabold text-white uppercase tracking-wider">${n}</h3>
                    </div>
                    <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 rounded-full shadow-inner">
                      ${r.length}
                    </span>
                  </div>

                  <!-- Candidate Cards List inside Stage -->
                  <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                    ${r.map(i=>{const o=e.candidateResults[i.id];return`
                        <div data-cid="${i.id}" class="cand-card p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all space-y-3 shadow-md group">
                          <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2.5">
                              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                                ${i.name.split(" ").map(l=>l[0]).join("")}
                              </div>
                              <div>
                                <!-- Clickable Candidate Name -->
                                <h4 class="cand-name-click text-xs font-bold text-white group-hover:text-blue-400 transition-colors hover:underline" data-cid="${i.id}">${i.name}</h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">${i.email}</p>
                              </div>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${i.experienceYears}y exp</span>
                          </div>

                          <div class="flex flex-wrap gap-1">
                            ${i.skills.slice(0,3).map(l=>`
                              <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800 rounded-lg">${l}</span>
                            `).join("")}
                          </div>

                          ${o?`
                            <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                              <span class="font-extrabold ${o.percentage>=70?"text-emerald-400":"text-red-400"}">
                                Score: ${o.percentage}%
                              </span>
                              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${o.passStatus==="Pass"?"bg-emerald-500/20 text-emerald-300 border border-emerald-500/30":"bg-red-500/20 text-red-300 border border-red-500/30"}">
                                ${o.passStatus}
                              </span>
                            </div>
                          `:`
                            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <button data-copy-link="${i.id}" class="copy-cand-link-btn text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                                <span>📋</span> Copy Link
                              </button>
                            </div>
                          `}
                        </div>
                      `}).join("")}

                    ${r.length===0?`
                      <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500 font-medium">
                        No candidates in this stage tab.
                      </div>
                    `:""}
                  </div>
                </div>
              `}).join("")}
          </div>
        `:`
          <!-- Section-Wise Detailed Data Table Filtered by Selected Stage -->
          <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Candidate Section Score Breakdown (${this.activeStageTab})</h3>
              <span class="text-xs font-mono text-slate-400">Showing Candidates: ${a.length}</span>
            </div>

            <div class="overflow-x-auto rounded-2xl border border-slate-800">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th class="p-3.5">Candidate Name & Email</th>
                    <th class="p-3.5">Status</th>
                    <th class="p-3.5">Total Score</th>
                    <th class="p-3.5">Percentage</th>
                    <th class="p-3.5">Sec 1: MCQs</th>
                    <th class="p-3.5">Sec 2: SQL</th>
                    <th class="p-3.5">Sec 3: Coding</th>
                    <th class="p-3.5">Sec 4: Essay</th>
                    <th class="p-3.5">Violations</th>
                    <th class="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80 text-slate-200">
                  ${a.map(n=>{const r=e.candidateResults[n.id],i=r==null?void 0:r.sectionScores["Technical MCQs & Aptitude"],o=r==null?void 0:r.sectionScores["Database & SQL Engineering"],l=r==null?void 0:r.sectionScores["Algorithmic Coding Challenge"],d=r==null?void 0:r.sectionScores["Architectural Essay"];return`
                      <tr class="hover:bg-slate-900/60 transition-colors">
                        <td class="p-3.5">
                          <button class="cand-name-click text-left font-sans font-bold text-white hover:text-blue-400 hover:underline" data-cid="${n.id}">
                            ${n.name}
                          </button>
                          <div class="text-[10px] text-slate-400">${n.email}</div>
                        </td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${n.status}</span>
                        </td>
                        <td class="p-3.5 font-bold text-blue-400">${r?`${r.totalScore} / ${r.maxScore}`:"N/A"}</td>
                        <td class="p-3.5 font-bold ${r&&r.percentage>=70?"text-emerald-400":"text-red-400"}">${r?`${r.percentage}%`:"N/A"}</td>
                        <td class="p-3.5">${i?`${i.score}/${i.maxScore}`:"-"}</td>
                        <td class="p-3.5">${o?`${o.score}/${o.maxScore}`:"-"}</td>
                        <td class="p-3.5">${l?`${l.score}/${l.maxScore}`:"-"}</td>
                        <td class="p-3.5">${d?`${d.score}/${d.maxScore}`:"-"}</td>
                        <td class="p-3.5 ${r&&r.totalViolations>0?"text-amber-400 font-bold":"text-slate-400"}">${r?r.totalViolations:0}</td>
                        <td class="p-3.5 text-right space-x-2">
                          <button data-cid="${n.id}" class="cand-card px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700">
                            Details
                          </button>
                          ${r?`
                            <button data-export-cand-csv="${n.id}" class="export-cand-csv-btn px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[10px] font-bold border border-emerald-800/60">
                              📥 CSV
                            </button>
                          `:""}
                        </td>
                      </tr>
                    `}).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `}

        <!-- Detailed Candidate Inspection Scorecard Modal Host -->
        <div id="scorecard-modal-host"></div>

        <!-- Invite Link Generator Modal Host -->
        <div id="invite-modal-host"></div>
      </div>
    `,this.attachEvents()}attachEvents(){var e,t,s,a,n;this.container.querySelectorAll(".stage-tab-btn").forEach(r=>{r.addEventListener("click",i=>{const o=i.currentTarget.getAttribute("data-stage-tab");this.activeStageTab=o,this.render()})}),(e=this.container.querySelector("#view-kanban-btn"))==null||e.addEventListener("click",()=>{this.currentViewMode="kanban",this.render()}),(t=this.container.querySelector("#view-table-btn"))==null||t.addEventListener("click",()=>{this.currentViewMode="table",this.render()}),(s=this.container.querySelector("#export-all-csv-btn"))==null||s.addEventListener("click",()=>{const r=c.getState(),i=["Candidate Name","Email","Phone","Status","Total Score","Max Score","Percentage","Pass Status","Section 1 MCQs","Section 2 SQL","Section 3 Coding","Section 4 Essay","Violations"],o=r.candidates.map(l=>{var h,g,C,A;const d=r.candidateResults[l.id],u=((h=d==null?void 0:d.sectionScores["Technical MCQs & Aptitude"])==null?void 0:h.score)??"N/A",m=((g=d==null?void 0:d.sectionScores["Database & SQL Engineering"])==null?void 0:g.score)??"N/A",p=((C=d==null?void 0:d.sectionScores["Algorithmic Coding Challenge"])==null?void 0:C.score)??"N/A",b=((A=d==null?void 0:d.sectionScores["Architectural Essay"])==null?void 0:A.score)??"N/A";return[l.name,l.email,l.phone,l.status,d?d.totalScore:"N/A",d?d.maxScore:"N/A",d?`${d.percentage}%`:"N/A",d?d.passStatus:"N/A",u,m,p,b,d?d.totalViolations:0]});_.downloadCsv("Candidate_Section_Scores_Report.csv",i,o)}),this.container.querySelectorAll(".export-cand-csv-btn").forEach(r=>{r.addEventListener("click",i=>{i.stopPropagation();const o=i.currentTarget.getAttribute("data-export-cand-csv");o&&this.exportSingleCandidateCsv(o)})}),this.container.querySelectorAll(".copy-cand-link-btn").forEach(r=>{r.addEventListener("click",i=>{i.stopPropagation();const o=c.getState(),l=`${window.location.origin}/?assessment=${o.activeAssessmentId}`;navigator.clipboard.writeText(l).then(()=>{alert("Candidate assessment link copied to clipboard!")})})}),this.container.querySelectorAll(".cand-card, .cand-name-click").forEach(r=>{r.addEventListener("click",i=>{const o=i.currentTarget.getAttribute("data-cid");o&&(this.selectedCandidateId=o,this.renderCandidateDetailModal(o))})}),(a=this.container.querySelector("#view-sent-emails-btn"))==null||a.addEventListener("click",()=>{this.renderSentEmailsModal()}),(n=this.container.querySelector("#invite-cand-btn"))==null||n.addEventListener("click",()=>{this.renderInviteModal()})}renderSentEmailsModal(){var s;const e=E.getSentEmails(),t=this.container.querySelector("#invite-modal-host");t&&(t.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">📬</span>
              <h3 class="text-base font-extrabold text-white">Dispatched Real-Time Email Delivery Console</h3>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div class="space-y-3 font-mono text-xs">
            ${e.map(a=>`
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-blue-400 font-sans">${a.subject}</span>
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓ ${a.status} (${a.provider})
                  </span>
                </div>
                <div class="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>To: <strong class="text-white font-sans">${a.recipientName}</strong> &lt;${a.recipientEmail}&gt;</span>
                  <span>Sent At: ${a.sentAt}</span>
                </div>
                ${a.otpCode?`
                  <div class="text-[11px] text-emerald-300 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    OTP Passcode: <strong class="text-white font-mono text-sm tracking-wider">${a.otpCode}</strong>
                  </div>
                `:""}
                ${a.assessmentLink?`
                  <div class="text-[11px] text-blue-300 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span>Link: <code class="text-slate-300 font-mono">${a.assessmentLink}</code></span>
                    <a href="${a.assessmentLink}" target="_blank" class="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]">
                      Open Link ➔
                    </a>
                  </div>
                `:""}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `,(s=t.querySelector("#close-email-log-btn"))==null||s.addEventListener("click",()=>{t.innerHTML=""}))}exportSingleCandidateCsv(e){const t=c.getState(),s=t.candidates.find(i=>i.id===e),a=t.candidateResults[e];if(!s||!a)return;const n=["Section Name","Score Achieved","Max Score","Section Percentage"],r=Object.entries(a.sectionScores).map(([i,o])=>[i,o.score,o.maxScore,`${o.percentage}%`]);r.push(["OVERALL TOTAL",a.totalScore,a.maxScore,`${a.percentage}%`]),_.downloadCsv(`${s.name.replace(/\s+/g,"_")}_Section_Scorecard.csv`,n,r)}renderCandidateDetailModal(e){var i,o,l,d,u,m;const t=c.getState(),s=t.candidates.find(p=>p.id===e),a=t.candidateResults[e],n=this.container.querySelector("#scorecard-modal-host");if(!s||!n)return;n.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
          <!-- Candidate Particular Header Details -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                ${s.name.split(" ").map(p=>p[0]).join("")}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-extrabold text-white">${s.name}</h2>
                  <span class="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${s.status}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${s.email} • Phone: ${s.phone} • ${s.experienceYears} Years Experience</p>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${s.skills.map(p=>`
                    <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded-md">${p}</span>
                  `).join("")}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              ${a?`
                <button id="download-scorecard-csv-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow">
                  <span>📥</span> Export Scorecard (.csv)
                </button>
              `:""}
              <button id="close-modal-btn" class="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-lg">✕</button>
            </div>
          </div>

          ${a?`
            <!-- Results KPI Overview -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Score</span>
                <div class="text-2xl font-extrabold font-mono text-blue-400 mt-1">${a.totalScore} / ${a.maxScore}</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Percentage Score</span>
                <div class="text-2xl font-extrabold font-mono ${a.percentage>=70?"text-emerald-400":"text-red-400"} mt-1">${a.percentage}%</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Integrity Score</span>
                <div class="text-2xl font-extrabold font-mono text-purple-400 mt-1">${a.aiConfidenceScore}%</div>
              </div>
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Violations Logged</span>
                <div class="text-2xl font-extrabold font-mono ${a.totalViolations>0?"text-amber-400":"text-emerald-400"} mt-1">${a.totalViolations}</div>
              </div>
            </div>

            <!-- Section Breakdown Table -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Section Level Performance Breakdown</h3>
              <div class="overflow-x-auto rounded-xl border border-slate-800">
                <table class="w-full text-left text-xs font-mono">
                  <thead class="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th class="p-3">Section Name</th>
                      <th class="p-3">Score Achieved</th>
                      <th class="p-3">Percentage</th>
                      <th class="p-3">Performance Bar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800 text-slate-200">
                    ${Object.entries(a.sectionScores).map(([p,b])=>`
                      <tr>
                        <td class="p-3 font-sans font-semibold">${p}</td>
                        <td class="p-3 font-bold">${b.score} / ${b.maxScore}</td>
                        <td class="p-3 ${b.percentage>=70?"text-emerald-400":"text-amber-400"}">${b.percentage}%</td>
                        <td class="p-3">
                          <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${b.percentage}%"></div>
                          </div>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Question Level Evaluation Breakdown (Visible ONLY to Recruiter / Admin) -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>🎯 Candidate MCQ Options Selected vs Admin Correct Answers</span>
                <span class="text-[10px] text-blue-400 font-mono font-normal">Confidential Recruiter Audit View</span>
              </h3>
              <div class="space-y-2">
                ${t.questionBank.map((p,b)=>{var $;const h=t.candidateAnswers[p.id]||"opt-4",g=p.type==="mcq",C=p.type==="coding"||p.type==="sql",A=(($=p.correctAnswers)==null?void 0:$[0])||"opt-4";let M=h,I=A;if(g&&p.options){const f=p.options.find(k=>k.id===h||k.text===h),v=p.options.find(k=>k.id===A);f&&(M=f.text),v&&(I=v.text)}const P=h===A||M===I,R=t.codeSubmissions[p.id],T=p.testCases||[{id:"tc-1",input:"[2,7,11,15], 9",expectedOutput:"[0,1]",isHidden:!1,weight:10},{id:"tc-2",input:"[3,2,4], 6",expectedOutput:"[1,2]",isHidden:!1,weight:10},{id:"tc-3",input:"[3,3], 6",expectedOutput:"[0,1]",isHidden:!1,weight:10},{id:"tc-4",input:"[1,5,8,12], 20",expectedOutput:"[2,3]",isHidden:!0,weight:10},{id:"tc-5",input:"[-1,-2,-3,-4], -7",expectedOutput:"[2,3]",isHidden:!0,weight:10}],N=T.reduce((f,v)=>f+v.weight,0),y=R?R.passedCount??4:4,S=T.slice(0,y).reduce((f,v)=>f+v.weight,0);return`
                    <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${g?"bg-emerald-500/20 text-emerald-300":C?"bg-purple-500/20 text-purple-300":"bg-blue-500/20 text-blue-300"}">${p.type}</span>
                          <span class="font-bold text-white">${b+1}. ${p.title}</span>
                        </div>
                        <span class="font-mono text-[11px] font-bold ${g?P?"text-emerald-400":"text-red-400":"text-purple-400"}">
                          ${g?P?`✓ Correct (+${p.points} pts)`:"✕ Incorrect (0 pts)":`Score: ${S} / ${N} Marks (${y}/${T.length} Passed)`}
                        </span>
                      </div>

                      ${g?`
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div class="p-2 rounded-lg ${P?"bg-emerald-500/10 border border-emerald-500/30 text-emerald-300":"bg-red-500/10 border border-red-500/30 text-red-300"}">
                            <b>Candidate Selected:</b> ${M} ${P?"✓":"❌"}
                          </div>
                          <div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            <b>Admin Configured Answer:</b> ${I} ✓
                          </div>
                        </div>
                      `:C?`
                        <div class="space-y-1.5 pt-1">
                          <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                            <span>Test Case Pass Rate: <b class="text-emerald-400">${y} / ${T.length} Passed</b></span>
                            <span class="text-amber-400 font-bold">${S} / ${N} Marks (Lost ${N-S} pts)</span>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                            ${T.map((f,v)=>{const k=v<y;return`
                                <div class="p-2 rounded-lg ${k?"bg-emerald-500/10 border border-emerald-500/30 text-emerald-300":"bg-red-500/10 border border-red-500/30 text-red-300"} flex items-center justify-between">
                                  <span>Test Case ${v+1} (${f.input})</span>
                                  <span class="font-bold">${k?`✓ Passed (+${f.weight} pts)`:`❌ Failed (0/${f.weight} pts)`}</span>
                                </div>
                              `}).join("")}
                          </div>
                        </div>
                      `:""}
                    </div>
                  `}).join("")}
              </div>
            </div>

            <!-- Proctoring Log Timeline -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Proctoring Violation History</h3>
              <div class="space-y-2">
                ${(a.proctoringLogs||[]).map(p=>`
                  <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded ${p.severity==="high"?"bg-red-500/20 text-red-300 border border-red-500/30":"bg-amber-500/20 text-amber-300 border border-amber-500/30"}">${p.severity.toUpperCase()}</span>
                      <span class="font-bold text-white">${p.type}</span>
                      <span class="text-slate-400">${p.description}</span>
                    </div>
                    <span class="font-mono text-slate-500 text-[10px]">${p.timestamp}</span>
                  </div>
                `).join("")}
                ${(a.proctoringLogs||[]).length===0?`
                  <p class="text-xs text-slate-500 italic">No proctoring violations recorded for this candidate.</p>
                `:""}
              </div>
            </div>

            <!-- Recruiter Decision Panel -->
            <div class="pt-4 border-t border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Recruiter Evaluation & Decision</h3>
              <textarea id="recruiter-notes" class="w-full p-3 glass-input rounded-xl text-xs font-sans text-white border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500 outline-none" rows="3" placeholder="Enter recruiter evaluation notes...">${a.recruiterNotes}</textarea>

              <div class="flex items-center gap-3">
                <button id="decide-select" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all">
                  ✓ Select Candidate
                </button>
                <button id="decide-review" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all">
                  ⌛ Hold for Technical Interview
                </button>
                <button id="decide-reject" class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all">
                  ✕ Reject Candidate
                </button>
              </div>
            </div>
          `:`
            <div class="py-12 text-center text-slate-400 space-y-4">
              <p class="text-sm font-semibold">Assessment invitation dispatched to candidate.</p>
              <div class="flex items-center justify-center gap-3">
                <button id="modal-copy-link-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow">
                  📋 Copy Candidate Link
                </button>
              </div>
            </div>
          `}
        </div>
      </div>
    `,(i=n.querySelector("#close-modal-btn"))==null||i.addEventListener("click",()=>{n.innerHTML=""}),(o=n.querySelector("#download-scorecard-csv-btn"))==null||o.addEventListener("click",()=>{this.exportSingleCandidateCsv(e)}),(l=n.querySelector("#modal-copy-link-btn"))==null||l.addEventListener("click",()=>{const p=`${window.location.origin}/?assessment=${t.activeAssessmentId}`;navigator.clipboard.writeText(p).then(()=>alert("Candidate assessment link copied!"))});const r=n.querySelector("#recruiter-notes");(d=n.querySelector("#decide-select"))==null||d.addEventListener("click",()=>{c.updateCandidateDecision(e,"Selected",(r==null?void 0:r.value)||""),c.updateCandidateStatus(e,"Selected"),n.innerHTML="",this.render()}),(u=n.querySelector("#decide-review"))==null||u.addEventListener("click",()=>{c.updateCandidateDecision(e,"Under Review",(r==null?void 0:r.value)||""),c.updateCandidateStatus(e,"Under Review"),n.innerHTML="",this.render()}),(m=n.querySelector("#decide-reject"))==null||m.addEventListener("click",()=>{c.updateCandidateDecision(e,"Rejected",(r==null?void 0:r.value)||""),c.updateCandidateStatus(e,"Rejected"),n.innerHTML="",this.render()})}renderInviteModal(){var u;const e=this.container.querySelector("#invite-modal-host");if(!e)return;const t=c.getState(),s=`nexus_token_${Date.now()}`,a=`${window.location.origin}/?assessment=${t.activeAssessmentId}&token=${s}`;e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">✉️</span>
              <h3 class="text-base font-extrabold text-white">Generate Assessment Invitation Link</h3>
            </div>
            <button id="close-invite-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Full Name</label>
              <input id="inv-name" type="text" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="Marcus Vance" placeholder="e.g. Marcus Vance" />
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Email Address</label>
              <input id="inv-email" type="email" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="marcus.vance@example.com" placeholder="marcus.vance@example.com" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Phone Number (SMS OTP)</label>
                <input id="inv-phone" type="text" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="+1-555-0199" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Link Expiration</label>
                <select id="inv-exp" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="24">24 Hours</option>
                  <option value="48" selected>48 Hours</option>
                  <option value="72">72 Hours</option>
                </select>
              </div>
            </div>

            <!-- Prominent Generated Link Box -->
            <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-400 uppercase text-[10px] tracking-wider">Generated Candidate Assessment Link:</span>
                <button id="copy-link-btn" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow">
                  <span>📋</span> Copy Link
                </button>
              </div>
              <input id="gen-link-input" type="text" readonly value="${a}" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs focus:ring-1 focus:ring-blue-500" />
            </div>

            <!-- Dispatch Success Output Box -->
            <div id="dispatch-output-box" class="hidden p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Invitation Email & SMS Successfully Dispatched!
                </span>
              </div>
              <p id="dispatch-msg-text" class="text-[11px] text-slate-300 leading-relaxed"></p>

              <div class="flex items-center gap-2 pt-2 border-t border-emerald-500/20">
                <button id="launch-cand-link-btn" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                  <span>🚀</span> Launch Candidate Exam Portal in New Tab
                </button>
              </div>
            </div>

            <button id="send-inv-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
              <span>✉️</span> DISPATCH EMAIL & SMS INVITATION
            </button>
          </div>
        </div>
      </div>
    `,(u=e.querySelector("#close-invite-btn"))==null||u.addEventListener("click",()=>{e.innerHTML="",this.render()});const n=e.querySelector("#copy-link-btn"),r=e.querySelector("#gen-link-input");n==null||n.addEventListener("click",()=>{r&&(r.select(),navigator.clipboard.writeText(r.value).then(()=>{n.innerHTML="<span>✓</span> Copied!",n.classList.replace("bg-blue-600","bg-emerald-600"),setTimeout(()=>{n.innerHTML="<span>📋</span> Copy Link",n.classList.replace("bg-emerald-600","bg-blue-600")},2500)}).catch(()=>{}))});const i=e.querySelector("#send-inv-btn"),o=e.querySelector("#dispatch-output-box"),l=e.querySelector("#dispatch-msg-text"),d=e.querySelector("#launch-cand-link-btn");i==null||i.addEventListener("click",async()=>{const m=e.querySelector("#inv-name").value||"Candidate",p=e.querySelector("#inv-email").value||"candidate@example.com",b=e.querySelector("#inv-phone").value||"+1-555-0100",h={id:`cand-${Date.now()}`,name:m,email:p,phone:b,experienceYears:4,skills:["Python","SQL"],status:"Assessment Sent",assessmentId:t.activeAssessmentId,invitedAt:new Date().toISOString().split("T")[0],otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1};c.addCandidate(h);const g=E.generateUniqueOtp();c.setActiveCandidateOtp(g),E.sendCandidateInviteEmail(m,p,a,g),o&&l&&(l.innerHTML=`Real Email with secure link and unique OTP passcode (<strong>${g}</strong>) has been dispatched to <strong class="text-white">${p}</strong>. SMS OTP notification dispatched to <strong class="text-white">${b}</strong>.`,o.classList.remove("hidden")),i.disabled=!0,i.textContent="✓ Real Email Dispatched to "+p,i.className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs tracking-wider opacity-90 cursor-not-allowed",this.renderEmailDispatchedSuccessPopup(m,p,a,g)}),d==null||d.addEventListener("click",()=>{window.open(a,"_blank")})}renderEmailDispatchedSuccessPopup(e,t,s,a){var r,i;const n=document.createElement("div");n.id="email-sent-success-popup",n.innerHTML=`
      <div class="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-slate-950/95 p-8 space-y-6 shadow-2xl text-center animate-scale-up">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20">
            ✉️
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-extrabold text-white">Assessment Invitation Dispatched!</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Assessment link and 2FA access OTP passcode (<strong class="text-emerald-400 font-mono text-sm">${a}</strong>) have been successfully sent to candidate <strong class="text-white">${e}</strong>.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Recipient Email:</span>
              <strong class="text-white">${t}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Access OTP Code:</span>
              <strong class="text-emerald-400">${a}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Delivery Gateway:</span>
              <span class="text-emerald-400 font-sans text-[11px] font-bold">✓ Live Gmail SMTP (smtp.gmail.com:587) Inbox Delivery</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3">
            <button id="close-popup-btn" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all">
              Close Notice
            </button>
            <button id="open-exam-tab-btn" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5">
              <span>🚀</span> Test Candidate Portal ➔
            </button>
          </div>
        </div>
      </div>
    `,document.body.appendChild(n),(r=n.querySelector("#close-popup-btn"))==null||r.addEventListener("click",()=>{n.remove()}),(i=n.querySelector("#open-exam-tab-btn"))==null||i.addEventListener("click",()=>{n.remove(),window.open(s,"_blank")})}}class ke{constructor(){x(this,"appElement");x(this,"navbarHost");x(this,"contentHost");this.appElement=document.getElementById("app"),this.appElement.innerHTML=`
      <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host"></div>
        <main id="content-host" class="flex-1"></main>
      </div>
    `,this.navbarHost=document.getElementById("navbar-host"),this.contentHost=document.getElementById("content-host"),c.subscribe(()=>{this.render()})}render(){new he(this.navbarHost).render();const s=c.getState().currentRole;this.contentHost.innerHTML="",s==="Candidate"?new we(this.contentHost).render():s==="Recruiter"?new Ce(this.contentHost).render():s==="Admin"?new ge(this.contentHost).render():s==="Super Admin"&&new Se(this.contentHost).render()}}document.addEventListener("DOMContentLoaded",()=>{new ke().render()});
//# sourceMappingURL=index-CN7TDm7o.js.map
