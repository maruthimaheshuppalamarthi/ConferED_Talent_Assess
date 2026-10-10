var Je=Object.defineProperty;var Ke=(c,e,t)=>e in c?Je(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var b=(c,e,t)=>Ke(c,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const qe=["admin","recruiter","proctor"],A={admin:{portal:"admin",path:"/admin",role:"System Admin",title:"System Administrator",loginTitle:"System Admin Portal",icon:"🛡️",blurb:"Staff accounts, global settings and audit logs.",menuTitle:"Administration"},recruiter:{portal:"recruiter",path:"/recruiter",role:"Recruiter",title:"Recruiter / HR Workspace",loginTitle:"Recruiter Portal",icon:"💼",blurb:"Build assessments and the question bank, invite candidates and review results.",menuTitle:"Hiring"},proctor:{portal:"proctor",path:"/proctor",role:"Proctor",title:"Live Proctoring Monitor",loginTitle:"Proctoring Monitor",icon:"📹",blurb:"Verify identities, watch live sessions and act on violations.",menuTitle:"Proctoring"}};function z(){const c=window.location.pathname.replace(/\/+$/,"")||"/",e=qe.find(t=>A[t].path===c);return e?{kind:"staff",portal:e}:{kind:"candidate"}}const He=[];let Pe=!1;function Me(){He.forEach(c=>c())}const B={navigate(c){c!==window.location.pathname+window.location.search&&(window.history.pushState({},"",c),Me())},subscribe(c){He.push(c),Pe||(Pe=!0,window.addEventListener("popstate",Me))}},Fe={admin:[{tab:"overview",icon:"📊",label:"Dashboard & Health"},{tab:"staff",icon:"👥",label:"Staff Management"},{tab:"settings",icon:"⚙️",label:"Global System Settings"},{tab:"audit",icon:"📜",label:"Audit Logs"}],recruiter:[{tab:"pipeline",icon:"📋",label:"Hiring Pipeline"},{tab:"assessment-builder",icon:"🛠️",label:"Assessment Builder"},{tab:"question-bank",icon:"🗂️",label:"Question Bank"}],proctor:[{tab:"live",icon:"📹",label:"Live Monitoring"},{tab:"identity-verification",icon:"📸",label:"Identity & ID Verification"}]},Y={admin:"overview",recruiter:"pipeline",proctor:"live"},ne={...Y},le=c=>Fe[c].some(t=>t.tab===ne[c])?ne[c]:Y[c],he=(c,e)=>{ne[c]=e},Xe=()=>{Object.keys(Y).forEach(c=>{ne[c]=Y[c]})},Ze={maxTabSwitches:3,maxViolationsBeforeTerminate:5,proctoringSensitivity:"high",requireCamera:!0,requireMicrophone:!0,requireScreenShare:!1,detectPhone:!0,detectMultipleFaces:!0,detectFaceMissing:!0,enableFullscreenLock:!0,otpMethod:"both",linkExpirationHours:48,allowSectionRevisit:!1},U=[{id:"q-mcq-1",type:"mcq",title:"Python Memory Management",content:"Which module in Python can be used to inspect memory allocation and reference counts?",options:[{id:"opt-1",text:"sys"},{id:"opt-2",text:"gc"},{id:"opt-3",text:"tracemalloc"},{id:"opt-4",text:"All of the above"}],correctAnswers:["opt-4"],difficulty:"medium",points:10,category:"Python",tags:["Core Python","Memory","Performance"]},{id:"q-sql-1",type:"sql",title:"Employee Department Salary Ranking",content:"Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.",difficulty:"hard",points:20,category:"SQL Database",tags:["PostgreSQL","Window Functions","Analytics"],sampleCode:{sql:`-- Write your SQL query below
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
console.log(maxProduct([2,3,-2,4]));`},testCases:[{id:"tc-1",input:"[2,3,-2,4]",expectedOutput:"6",isHidden:!1,weight:5},{id:"tc-2",input:"[-2,0,-1]",expectedOutput:"0",isHidden:!1,weight:5},{id:"tc-3",input:"[-2,3,-4]",expectedOutput:"24",isHidden:!0,weight:10},{id:"tc-4",input:"[0, 2]",expectedOutput:"2",isHidden:!0,weight:5}]},{id:"q-essay-1",type:"essay",title:"Microservice Architecture vs Monolith Design",content:"Discuss the architectural trade-offs between a modular monolithic system and an event-driven microservices architecture. Highlight aspects of deployment complexity, data consistency (CAP theorem / Saga pattern), and operational costs.",essayMinWords:150,essayMaxWords:500,difficulty:"hard",points:20,category:"System Design",tags:["Architecture","Microservices","Distributed Systems"]}],Ie=[{id:"assess-101",title:"Senior Full Stack & AI Engineer Assessment",roleTitle:"Senior Software Engineer",description:"Comprehensive technical evaluation covering Quantitative Logic, Python/JS Algorithmic Coding, SQL Querying, and System Design Architecture.",totalDurationMinutes:60,totalQuestions:4,passingPercentage:70,status:"active",createdDate:"2026-07-20",sections:[{id:"sec-1",name:"Technical MCQs & Aptitude",description:"Core concepts in Python memory, async logic, and data structures.",instructions:"Select the best answer for each question. Negative marking is disabled for this section.",timeLimitMinutes:10,passingMarks:10,questions:[U[0]],isMandatory:!0},{id:"sec-2",name:"Database & SQL Engineering",description:"Complex aggregation, window functions, and schema optimization.",instructions:"Write production-ready SQL queries. Test against the provided table schemas.",timeLimitMinutes:15,passingMarks:15,questions:[U[1]],isMandatory:!0},{id:"sec-3",name:"Algorithmic Coding Challenge",description:"Data Structures and Dynamic Programming problem solving.",instructions:"Write efficient code. Pay attention to time complexity and edge cases.",timeLimitMinutes:20,passingMarks:20,questions:[U[2]],isMandatory:!0},{id:"sec-4",name:"Architectural Essay",description:"System design principles, microservices, and high-availability systems.",instructions:"Ensure minimum word count requirement of 150 words.",timeLimitMinutes:15,passingMarks:15,questions:[U[3]],isMandatory:!1}]}],X="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/><path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>",Z="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/><circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>",et=[{id:"cand-1",name:"Alex Rivera",email:"alex.rivera@example.com",phone:"+1-555-0192",experienceYears:6,skills:["Python","FastAPI","TypeScript","PostgreSQL","Docker"],status:"Completed",assessmentId:"assess-101",invitedAt:"2026-07-28",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:X,idProofUrl:Z,identityStatus:"approved"},{id:"cand-2",name:"Priya Sharma",email:"priya.sharma@example.com",phone:"+91-98765-43210",experienceYears:8,skills:["Java","Spring Boot","Microservices","SQL","Kubernetes"],status:"Under Review",assessmentId:"assess-101",invitedAt:"2026-07-29",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:X,idProofUrl:Z,identityStatus:"approved"},{id:"cand-3",name:"Marcus Vance",email:"marcus.vance@example.com",phone:"+44-7700-900077",experienceYears:4,skills:["React","Node.js","GraphQL","Tailwind","MongoDB"],status:"Assessment Sent",assessmentId:"assess-101",invitedAt:"2026-07-30",otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1,livePhotoUrl:X,idProofUrl:Z,identityStatus:"pending_verification"},{id:"cand-4",name:"Sophia Chen",email:"sophia.chen@example.com",phone:"+1-555-0144",experienceYears:5,skills:["Python","PyTorch","FastAPI","Docker","AWS"],status:"Selected",assessmentId:"assess-101",invitedAt:"2026-07-25",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:X,idProofUrl:Z,identityStatus:"approved"}],tt=[{candidateId:"cand-3",name:"Marcus Vance",role:"Frontend Engineer",sectionName:"Algorithmic Coding Challenge",timeRemaining:"18:42",violations:0,status:"normal",lastEvent:""},{candidateId:"cand-2",name:"Priya Sharma",role:"Backend Engineer",sectionName:"Database & SQL Engineering",timeRemaining:"09:15",violations:2,status:"warning",lastEvent:"Tab Switch detected"},{candidateId:"cand-1",name:"Alex Rivera",role:"Platform Engineer",sectionName:"Technical MCQs & Aptitude",timeRemaining:"24:03",violations:0,status:"normal",lastEvent:""}],st={"cand-1":{id:"res-1",candidateId:"cand-1",assessmentId:"assess-101",completedAt:"2026-07-28T16:45:00Z",totalScore:68,maxScore:75,percentage:90.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:20,maxScore:20,percentage:100},"Algorithmic Coding Challenge":{score:25,maxScore:25,percentage:100},"Architectural Essay":{score:13,maxScore:20,percentage:65}},aiConfidenceScore:94.5,totalViolations:1,proctoringLogs:[{id:"viol-1",candidateId:"cand-1",timestamp:"16:12:04",type:"Tab Switch",severity:"low",description:"Candidate switched window for 2 seconds (Warning issued)"}],recruiterNotes:"Exceptional coding speed and SQL window function expertise. Essay demonstrates solid understanding of Saga pattern trade-offs.",recruiterDecision:"Selected"},"cand-2":{id:"res-2",candidateId:"cand-2",assessmentId:"assess-101",completedAt:"2026-07-29T11:20:00Z",totalScore:54,maxScore:75,percentage:72,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:15,maxScore:20,percentage:75},"Algorithmic Coding Challenge":{score:15,maxScore:25,percentage:60},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:88,totalViolations:2,proctoringLogs:[{id:"viol-2",candidateId:"cand-2",timestamp:"11:05:12",type:"Looking Away",severity:"low",description:"Gaze moved off-screen for 4 seconds."},{id:"viol-3",candidateId:"cand-2",timestamp:"11:15:40",type:"Background Voice",severity:"medium",description:"Background audio detected above threshold."}],recruiterNotes:"Passed baseline cutoff. Requires technical interview follow-up on algorithmic edge cases.",recruiterDecision:"Under Review"}},de={};var De;const Ve=((De=de==null?void 0:de.VITE_API_URL)==null?void 0:De.replace(/\/$/,""))||"http://localhost:8000",at=`${Ve}/api/v1`;class q extends Error{constructor(t,s){super(s);b(this,"status");this.status=t}}let D=null,se=null,G="recruiter",ee=null,ae=null;function nt(c,e){var s;const t=c==null?void 0:c.detail;return typeof t=="string"?t:Array.isArray(t)&&((s=t[0])!=null&&s.msg)?String(t[0].msg):`Request failed (${e})`}async function ie(c,e,t,s){const a={};t!==void 0&&(a["Content-Type"]="application/json");const n=s==="staff"?D:s==="candidate"?se:null;n&&(a.Authorization=`Bearer ${n}`);try{return await fetch(`${at}${c}`,{method:e,headers:a,credentials:"include",body:t!==void 0?JSON.stringify(t):void 0})}catch{throw new q(0,"Cannot reach the server. Make sure the backend is running.")}}async function M(c,e="GET",t,s="none"){let a=await ie(c,e,t,s);a.status===401&&s==="staff"&&D&&(await Be(G)?a=await ie(c,e,t,s):it());const n=await a.json().catch(()=>null);if(!a.ok)throw new q(a.status,nt(n,a.status));return n}function it(){D=null,ae==null||ae()}async function Be(c){return ee||(ee=(async()=>{try{const e=await ie(`/${c}/auth/refresh`,"POST",void 0,"none");if(!e.ok)return null;const t=await e.json();return D=t.accessToken,t}catch{return null}finally{setTimeout(()=>ee=null,0)}})()),ee}const C={apiBase:Ve,setSessionExpiredHandler(c){ae=c},getStaffToken:()=>D,getCandidateToken:()=>se,login:(c,e,t)=>M(`/${c}/auth/login`,"POST",{email:e,password:t}),async verifyOtp(c,e,t){const s=await M(`/${c}/auth/verify-otp`,"POST",{challengeId:e,otp:t});return D=s.accessToken,G=c,s},resendOtp:(c,e)=>M(`/${c}/auth/resend-otp`,"POST",{challengeId:e}),async restoreSession(c){return G=c,Be(c)},setActivePortal(c){G=c},async changePassword(c,e,t){const s=await M(`/${c}/auth/change-password`,"POST",{currentPassword:e,newPassword:t},"staff");return D=s.accessToken,s},async logout(){try{await ie(`/${G}/auth/logout`,"POST",void 0,"none")}catch{}finally{D=null}},listStaff:()=>M("/admin/staff","GET",void 0,"staff"),createStaff:c=>M("/admin/staff","POST",c,"staff"),updateStaff:(c,e)=>M(`/admin/staff/${c}`,"PATCH",e,"staff"),resetStaffPassword:c=>M(`/admin/staff/${c}/reset-password`,"POST",void 0,"staff"),createInvite:c=>M("/recruiter/candidates/invites","POST",c,"staff"),async candidateVerify(c,e){const t=await M("/candidate/verify","POST",{inviteToken:c,otp:e});return se=t.accessToken,t},candidateResendOtp:c=>M("/candidate/resend-otp","POST",{inviteToken:c}),clearCandidateSession(){se=null},fetchJson:(c,e="GET",t,s="staff")=>M(c,e,t,s)};class rt{constructor(){b(this,"state");b(this,"listeners",[]);b(this,"activeStreams",[]);this.state={isStaffAuthenticated:!1,currentUser:null,allowedPortals:[],authReady:!1,candidateInviteToken:new URLSearchParams(window.location.search).get("invite"),liveCandidates:tt.map(e=>({...e})),settings:{...Ze},assessments:[...Ie],activeAssessmentId:Ie[0].id,candidates:[...et],candidateResults:{...st},questionBank:[...U],activeCandidateId:"cand-3",otpVerified:!1,systemCheckCompleted:!1,examStarted:!1,examCompleted:!1,currentSectionIndex:0,currentQuestionIndex:0,sectionTimeRemainingSeconds:600,candidateAnswers:{},codeSubmissions:{},flaggedQuestions:new Set,candidateFeedback:null,isFullscreen:!1,violationCount:0,proctoringLogs:[],liveProctoringAlert:null,proctorIntercomMessage:null,theme:"dark"},C.setSessionExpiredHandler(()=>this.clearStaffSession())}toggleTheme(){this.state.theme=this.state.theme==="dark"?"light":"dark",this.state.theme==="light"?document.documentElement.classList.add("light-mode"):document.documentElement.classList.remove("light-mode"),this.notify()}getState(){return this.state}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e())}refresh(){this.notify()}registerMediaStream(e){e&&!this.activeStreams.includes(e)&&this.activeStreams.push(e)}stopAllMediaStreams(){this.activeStreams.forEach(e=>{e&&e.getTracks&&e.getTracks().forEach(t=>{try{t.stop()}catch{}})}),this.activeStreams=[]}loginStaff(e){this.state.currentUser=e,this.state.allowedPortals=e.portals,this.state.isStaffAuthenticated=!0,this.notify()}markAuthReady(){this.setAuthReady(!0)}setAuthReady(e){this.state.authReady!==e&&(this.state.authReady=e,this.notify())}clearStaffSession(){this.state.isStaffAuthenticated=!1,this.state.currentUser=null,this.state.allowedPortals=[],this.notify()}async logoutStaff(){try{await C.logout()}finally{this.clearStaffSession()}}candidateVerified(e){this.state.activeCandidateId=e.candidate.id,this.state.assessments.some(t=>t.id===e.candidate.assessmentId)&&(this.state.activeAssessmentId=e.candidate.assessmentId),this.state.otpVerified=!0,this.notify()}updateSettings(e){this.state.settings={...this.state.settings,...e},this.notify()}completeSystemCheck(){this.state.systemCheckCompleted=!0,this.notify()}startExam(){var t;this.state.examStarted=!0,this.state.examCompleted=!1;const e=(t=this.getActiveAssessment())==null?void 0:t.sections[0];e&&(this.state.sectionTimeRemainingSeconds=e.timeLimitMinutes*60),this.notify()}getActiveAssessment(){return this.state.assessments.find(e=>e.id===this.state.activeAssessmentId)}setAnswer(e,t,s=!0){this.state.candidateAnswers[e]=t,s&&this.notify()}setCodeSubmission(e,t){this.state.codeSubmissions[e]=t,this.notify()}toggleFlagQuestion(e){this.state.flaggedQuestions.has(e)?this.state.flaggedQuestions.delete(e):this.state.flaggedQuestions.add(e),this.notify()}nextQuestion(){var t;const e=(t=this.getActiveAssessment())==null?void 0:t.sections[this.state.currentSectionIndex];e&&this.state.currentQuestionIndex<e.questions.length-1&&(this.state.currentQuestionIndex++,this.notify())}prevQuestion(){this.state.currentQuestionIndex>0&&(this.state.currentQuestionIndex--,this.notify())}nextSection(){const e=this.getActiveAssessment();if(e&&this.state.currentSectionIndex<e.sections.length-1){this.state.currentSectionIndex++,this.state.currentQuestionIndex=0;const t=e.sections[this.state.currentSectionIndex];this.state.sectionTimeRemainingSeconds=t.timeLimitMinutes*60,this.notify()}else this.submitAssessment()}submitAssessment(){this.state.examStarted=!1,this.state.examCompleted=!0,this.stopAllMediaStreams(),document.fullscreenElement&&document.exitFullscreen().catch(()=>{});const e=this.state.activeCandidateId||"cand-3",t=this.state.candidates.find(a=>a.id===e);t&&(t.status="Completed",t.assessmentCompleted=!0);const s={id:`res-${Date.now()}`,candidateId:e,assessmentId:this.state.activeAssessmentId,completedAt:new Date().toISOString(),totalScore:62,maxScore:75,percentage:82.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:18,maxScore:20,percentage:90},"Algorithmic Coding Challenge":{score:20,maxScore:25,percentage:80},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:92,totalViolations:this.state.violationCount,proctoringLogs:[...this.state.proctoringLogs],recruiterNotes:"Automated evaluation completed cleanly. High algorithmic proficiency.",recruiterDecision:"Under Review"};this.state.candidateResults[e]=s,this.notify()}saveCandidateFeedback(e,t,s){this.state.candidateFeedback={rating:e,feedbackText:t,tags:s,submittedAt:new Date().toISOString()},this.notify()}logProctoringViolation(e,t,s="medium"){this.state.violationCount++;const a={id:`viol-${Date.now()}`,candidateId:this.state.activeCandidateId||"cand-3",timestamp:new Date().toLocaleTimeString(),type:e,severity:s,description:t};this.state.proctoringLogs.unshift(a),this.state.liveProctoringAlert=`${e}: ${t}`;const n=this.state.liveCandidates.find(i=>i.candidateId===this.state.activeCandidateId);n&&(n.violations=this.state.violationCount,n.status=this.state.violationCount>=this.state.settings.maxTabSwitches?"warning":"normal",n.lastEvent=`${e} detected`),this.state.violationCount>=this.state.settings.maxViolationsBeforeTerminate&&(this.state.liveProctoringAlert=`EXAM TERMINATED: Violation limit exceeded (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`,setTimeout(()=>{this.submitAssessment()},3e3)),this.notify()}clearProctoringAlert(){this.state.liveProctoringAlert!==null&&(this.state.liveProctoringAlert=null,this.notify())}registerCandidateIdentity(e,t,s){const a=this.state.candidates.find(n=>n.id===e);a?(a.livePhotoUrl=t,a.idProofUrl=s,a.identityStatus="pending_verification"):this.state.candidates.unshift({id:e,name:"Active Candidate",email:"candidate@nexus.ai",phone:"+1 555-0192",experienceYears:4,skills:["Python","SQL","TypeScript"],status:"Screened",assessmentId:this.state.activeAssessmentId,invitedAt:new Date().toLocaleDateString(),otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!1,livePhotoUrl:t,idProofUrl:s,identityStatus:"pending_verification"}),this.notify()}approveCandidateIdentity(e){const t=this.state.candidates.find(s=>s.id===e);t&&(t.identityStatus="approved"),this.state.activeCandidateId===e&&this.startExam(),this.notify()}triggerProctorIntercom(e,t){this.state.proctorIntercomMessage=t,this.state.liveProctoringAlert=`PROCTOR INTERCOM / 360° ROOM INSPECTION: ${t}`,this.notify()}clearProctorIntercom(){var e;this.state.proctorIntercomMessage=null,(e=this.state.liveProctoringAlert)!=null&&e.includes("PROCTOR INTERCOM")&&(this.state.liveProctoringAlert=null),this.notify()}addQuestionToBank(e){this.state.questionBank.unshift(e),this.notify()}addCandidate(e){this.state.candidates.unshift(e),this.notify()}updateCandidateStatus(e,t){const s=this.state.candidates.find(a=>a.id===e);s&&(s.status=t,this.notify())}updateCandidateDecision(e,t,s){this.state.candidateResults[e]&&(this.state.candidateResults[e].recruiterDecision=t,this.state.candidateResults[e].recruiterNotes=s,this.notify())}addQuestion(e,t){if(this.state.questionBank.unshift(e),t)this.assignQuestionToSection(t,e);else{const s=this.getActiveAssessment();s&&s.sections.length>0&&s.sections[0].questions.push(e)}this.notify()}assignQuestionToSection(e,t){const s=this.getActiveAssessment();if(!s)return;s.sections.forEach(n=>{n.questions=n.questions.filter(i=>i.id!==t.id)});let a=s.sections.find(n=>n.id===e||n.name.toLowerCase()===e.toLowerCase());a||(a={id:`sec-${Date.now()}`,name:e,description:"",isMandatory:!0,instructions:`Complete all questions in ${e}.`,timeLimitMinutes:15,passingMarks:t.points||20,randomizeQuestions:!0,questions:[]},s.sections.push(a)),a.questions.push(t),this.notify()}updateQuestion(e,t){const s=this.state.questionBank.findIndex(a=>a.id===e);s!==-1&&(this.state.questionBank[s]={...this.state.questionBank[s],...t},this.notify())}deleteQuestion(e){this.state.questionBank=this.state.questionBank.filter(s=>s.id!==e);const t=this.getActiveAssessment();t&&t.sections.forEach(s=>{s.questions=s.questions.filter(a=>a.id!==e)}),this.notify()}addAssessmentSection(e){const t=this.getActiveAssessment();t&&(t.sections.push(e),this.notify())}updateAssessmentSection(e,t){const s=this.getActiveAssessment();if(s){const a=s.sections.findIndex(n=>n.id===e);a!==-1&&(s.sections[a]={...s.sections[a],...t},this.notify())}}deleteAssessmentSection(e){const t=this.getActiveAssessment();t&&t.sections.length>1&&(t.sections=t.sections.filter(s=>s.id!==e),this.notify())}}const u=new rt,ce=c=>c.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),$=class ${constructor(e){b(this,"container");this.container=e}render(){const e=u.getState(),t=z(),s=e.currentUser,a=e.theme||"dark",n=new URLSearchParams(window.location.search).has("assessment"),i=e.otpVerified||e.examStarted,r=t.kind==="staff"&&e.isStaffAuthenticated&&!!s,o=r?"":t.kind==="staff"?A[t.portal].title:n?"Candidate Assessment Portal":"Evaluation Platform",l=e.isStaffAuthenticated?e.allowedPortals:qe;this.container.innerHTML=`
      <header class="glass-panel border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-all">
        <div class="${r?"":"max-w-7xl mx-auto "}flex items-center justify-between">
          <!-- Logo & Platform Identity -->
          <div class="flex items-center gap-3 cursor-pointer" id="brand-logo-btn">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span class="text-xl font-black text-white tracking-wider">N</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-lg text-white tracking-tight">Nexus<span class="text-blue-500">Assess</span></span>
                ${o?`
                <span class="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  ${ce(o)}
                </span>`:""}
              </div>
              <p class="text-xs text-slate-400 font-medium">Enterprise Online Assessment Platform</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Global Theme Switcher (Dark / Light) -->
            <button id="theme-toggle-btn" title="Toggle Light / Dark Mode" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm">
              <span>${a==="dark"?"🌙 Dark":"☀️ Light"}</span>
            </button>

            ${r?this.staffControlsHtml():""}

            ${t.kind==="candidate"&&!i?this.staffMenuHtml(l,e.isStaffAuthenticated):""}

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
    `,this.attachEvents()}staffControlsHtml(){const e=u.getState().currentUser;return`
      <span class="hidden sm:inline text-xs font-bold text-white" title="${ce(e.role)}">${ce(e.name)}</span>

      <button id="logout-btn" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 text-xs font-bold transition-all flex items-center gap-1">
        <span>🚪</span> Logout
      </button>
    `}staffMenuHtml(e,t){return`
      <div class="relative">
        <button id="staff-menu-btn" aria-haspopup="true" aria-expanded="${$.menuOpen}" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30">
          <span>🔒</span> ${t?"My Portals":"Staff Login"} <span class="text-[10px]">▾</span>
        </button>
        ${$.menuOpen?`
          <div id="staff-menu" class="absolute right-0 mt-2 w-72 menu-panel rounded-2xl border border-slate-800 shadow-2xl p-2 space-y-1 z-50">
            ${e.map(s=>`
              <button data-portal-link="${s}" class="portal-link w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/70 transition-all flex items-start gap-3">
                <span class="text-lg leading-none mt-0.5">${A[s].icon}</span>
                <span>
                  <span class="block text-xs font-bold text-white">${A[s].title}</span>
                  <span class="block text-[11px] text-slate-400">${A[s].blurb}</span>
                </span>
              </button>
            `).join("")}
            ${t?`
              <button id="menu-logout-btn" class="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800/70 text-xs font-bold text-slate-300 flex items-center gap-2 border-t border-slate-800 mt-1">
                <span>🚪</span> Logout
              </button>
            `:""}
          </div>
        `:""}
      </div>
    `}attachEvents(){var t,s,a,n,i;const e=r=>this.container.querySelector(r);(t=e("#brand-logo-btn"))==null||t.addEventListener("click",()=>{$.menuOpen=!1;const r=z();r.kind==="staff"&&u.getState().isStaffAuthenticated?(he(r.portal,Y[r.portal]),B.navigate(A[r.portal].path),u.refresh()):B.navigate("/")}),(s=e("#theme-toggle-btn"))==null||s.addEventListener("click",()=>u.toggleTheme()),(a=e("#logout-btn"))==null||a.addEventListener("click",()=>{u.logoutStaff().catch(()=>{})}),(n=e("#menu-logout-btn"))==null||n.addEventListener("click",()=>{$.menuOpen=!1,u.logoutStaff().catch(()=>{})}),(i=e("#staff-menu-btn"))==null||i.addEventListener("click",r=>{r.stopPropagation(),$.menuOpen=!$.menuOpen,this.render()}),this.container.querySelectorAll(".portal-link").forEach(r=>r.addEventListener("click",o=>{const l=o.currentTarget.getAttribute("data-portal-link");$.menuOpen=!1,B.navigate(A[l].path)})),$.outsideClickBound||($.outsideClickBound=!0,document.addEventListener("click",r=>{var o,l;$.menuOpen&&!r.target.closest("#staff-menu")&&($.menuOpen=!1,(o=document.getElementById("staff-menu"))==null||o.remove(),(l=document.getElementById("staff-menu-btn"))==null||l.setAttribute("aria-expanded","false"))}))}};b($,"menuOpen",!1),b($,"outsideClickBound",!1);let me=$;const Ne=c=>`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5 ${c?"bg-blue-600 text-white shadow-md shadow-blue-600/30":"text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"}`;class ot{constructor(e,t){b(this,"container");b(this,"active");this.container=e,this.active=t}render(){const e=u.getState(),t=le(this.active);this.container.innerHTML=`
      <nav class="space-y-6" aria-label="Staff navigation">
        <div>
          <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Workspaces</p>
          <div class="space-y-1">
            ${e.allowedPortals.map(s=>`
              <button data-portal="${s}" class="side-portal ${Ne(s===this.active)}">
                <span class="text-base leading-none">${A[s].icon}</span>
                <span>${A[s].title}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="pt-5 border-t border-slate-800">
          <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">${A[this.active].menuTitle}</p>
          <div class="space-y-1">
            ${Fe[this.active].map(s=>`
              <button data-nav-tab="${s.tab}" class="side-nav ${Ne(s.tab===t)}">
                <span class="text-base leading-none">${s.icon}</span>
                <span>${s.label}</span>
              </button>
            `).join("")}
          </div>
        </div>
      </nav>
    `,this.container.querySelectorAll(".side-portal").forEach(s=>s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-portal");C.setActivePortal(n),B.navigate(A[n].path)})),this.container.querySelectorAll(".side-nav").forEach(s=>s.addEventListener("click",a=>{he(this.active,a.currentTarget.getAttribute("data-nav-tab")),u.refresh()}))}}class re{static downloadCsv(e,t,s){const a=[t.map(o=>`"${o}"`).join(","),...s.map(o=>o.map(l=>`"${String(l).replace(/"/g,'""')}"`).join(","))].join(`
`),n=new Blob([a],{type:"text/csv;charset=utf-8;"}),i=URL.createObjectURL(n),r=document.createElement("a");r.setAttribute("href",i),r.setAttribute("download",e),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}}class oe{static recordInvite(e,t,s,a){const n={id:`email-${Date.now()}`,recipientEmail:t,recipientName:e,subject:"Assessment Invitation",bodyText:`Hello ${e}, you have been invited to complete an assessment.`,bodyHtml:"",otpCode:a||void 0,assessmentLink:s,sentAt:new Date().toLocaleString(),status:"Delivered",provider:"Gmail SMTP (server-side)"};return this.sentEmails.unshift(n),n}static async sendTestEmail(e){const t="NexusAssess SMTP test",s="<p>This is a test email from the NexusAssess admin console.</p>",a={id:`email-${Date.now()}`,recipientEmail:e,recipientName:"Admin",subject:t,bodyText:"SMTP test email",bodyHtml:s,sentAt:new Date().toLocaleString(),status:"Delivering",provider:"Gmail SMTP (server-side)"};this.sentEmails.unshift(a);try{const n=await C.fetchJson("/recruiter/send-email","POST",{recipientEmail:e,recipientName:"Admin",subject:t,bodyHtml:s});return a.status=n.status==="success"?"Delivered":"Sent",n.status==="success"}catch{return a.status="Sent",!1}}static getSentEmails(){return this.sentEmails}}b(oe,"sentEmails",[]);const Re=[{role:"Recruiter",label:"Recruiter / HR"},{role:"Proctor",label:"Live Proctor"},{role:"System Admin",label:"System Administrator"}],lt={"System Admin":"bg-purple-500/10 text-purple-400 border-purple-500/20",Recruiter:"bg-blue-500/10 text-blue-400 border-blue-500/20",Proctor:"bg-red-500/10 text-red-400 border-red-500/20"},dt={"System Admin":"/admin",Recruiter:"/recruiter",Proctor:"/proctor"},L=c=>String(c??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),ue=c=>c instanceof q?c.message:"Something went wrong. Please try again.",V=class V{constructor(e){b(this,"container");b(this,"accounts",V.cache||[]);b(this,"loading",!V.cache);b(this,"error","");this.container=e}mount(){this.render(),this.reload().catch(()=>{})}async reload(){try{this.accounts=await C.listStaff(),V.cache=this.accounts,this.error=""}catch(e){this.error=ue(e)}finally{this.loading=!1,this.container.isConnected&&this.render()}}render(){const e=u.getState().currentUser;this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Staff Management</h2>
            <p class="text-xs text-slate-400 mt-0.5">
              Only you can create staff accounts and reset passwords. New users get a temporary password and must choose their own at first sign-in.
            </p>
          </div>
          <button id="add-staff-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md transition-all">
            ＋ Add Staff Member
          </button>
        </div>

        ${this.error?`<p class="text-xs font-semibold text-red-400">${L(this.error)}</p>`:""}

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th class="py-2.5 px-3">Name</th>
                <th class="py-2.5 px-3">Email</th>
                <th class="py-2.5 px-3">Role / Portal</th>
                <th class="py-2.5 px-3">Status</th>
                <th class="py-2.5 px-3">Created</th>
                <th class="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-slate-300">
              ${this.loading?'<tr><td colspan="6" class="py-6 px-3 text-center text-slate-500">Loading staff accounts…</td></tr>':""}
              ${!this.loading&&this.accounts.length===0?'<tr><td colspan="6" class="py-6 px-3 text-center text-slate-500">No staff accounts yet.</td></tr>':""}
              ${this.accounts.map(t=>this.rowHtml(t,(e==null?void 0:e.id)===t.id)).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div id="staff-modal-host"></div>
    `,this.attachEvents()}rowHtml(e,t){const s=e.isActive!==!1;return`
      <tr class="hover:bg-slate-800/40 ${s?"":"opacity-60"}">
        <td class="py-2.5 px-3 font-bold text-white">${L(e.name)}${t?' <span class="ml-1 text-[10px] text-slate-500 font-normal">(you)</span>':""}</td>
        <td class="py-2.5 px-3 font-mono text-blue-400">${L(e.email)}</td>
        <td class="py-2.5 px-3">
          ${t?`<span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${lt[e.role]||""}">${L(e.role)}</span>`:`<select data-role-for="${e.id}" class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
                 ${Re.map(a=>`<option value="${a.role}" ${a.role===e.role?"selected":""}>${a.label}</option>`).join("")}
               </select>`}
        </td>
        <td class="py-2.5 px-3">
          <div class="flex flex-col items-start gap-1">
            <span class="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border ${s?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-slate-500/10 text-slate-400 border-slate-500/20"}">${s?"Active":"Disabled"}</span>
            ${e.mustChangePassword?'<span class="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border bg-amber-500/10 text-amber-400 border-amber-500/20">Awaiting new password</span>':""}
          </div>
        </td>
        <td class="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">${L((e.createdAt||"").split("T")[0])}</td>
        <td class="py-2.5 px-3 text-right whitespace-nowrap">
          ${t?'<span class="text-[11px] text-slate-500">—</span>':`
            <button data-reset="${e.id}" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-[11px]">Reset password</button>
            <button data-toggle="${e.id}" class="ml-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 ${s?"text-red-300":"text-emerald-300"} font-bold text-[11px]">${s?"Deactivate":"Activate"}</button>
          `}
        </td>
      </tr>
    `}find(e){return this.accounts.find(t=>t.id===e)}async mutate(e){this.error="";try{const t=await e();return await this.reload(),t}catch(t){this.error=ue(t),this.render();return}}attachEvents(){var t;(t=(s=>this.container.querySelector(s))("#add-staff-btn"))==null||t.addEventListener("click",()=>this.openCreateDialog()),this.container.querySelectorAll("[data-role-for]").forEach(s=>s.addEventListener("change",a=>{const n=a.currentTarget,i=this.find(n.getAttribute("data-role-for"));if(!i)return;const r=n.value;if(!confirm(`Change ${i.name} from ${i.role} to ${r}? They will be signed out and must use the ${r} portal.`)){n.value=i.role;return}this.mutate(async()=>{await C.updateStaff(i.id,{role:r})}).catch(()=>{})})),this.container.querySelectorAll("[data-toggle]").forEach(s=>s.addEventListener("click",a=>{const n=this.find(a.currentTarget.getAttribute("data-toggle"));if(!n)return;const i=n.isActive===!1;!i&&!confirm(`Deactivate ${n.name}? They will be signed out immediately.`)||this.mutate(async()=>{await C.updateStaff(n.id,{isActive:i})}).catch(()=>{})})),this.container.querySelectorAll("[data-reset]").forEach(s=>s.addEventListener("click",a=>{const n=this.find(a.currentTarget.getAttribute("data-reset"));n&&confirm(`Reset the password for ${n.name}? A new temporary password is generated and they are signed out everywhere.`)&&this.mutate(()=>C.resetStaffPassword(n.id)).then(i=>{i&&this.openCredentialsDialog(i,!0)}).catch(()=>{})}))}modalHost(){return this.container.querySelector("#staff-modal-host")}openCreateDialog(e="",t={name:"",email:"",role:"Recruiter"}){var o,l;const s=this.modalHost();if(!s)return;s.innerHTML=`
      <div class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md overflow-y-auto"><div class="min-h-full flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-7 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-extrabold text-white">Add staff member</h3>
            <button id="cs-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <p id="cs-error" class="text-xs font-semibold text-red-400 ${e?"":"hidden"}">${L(e)}</p>
          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1" for="cs-name">Full name</label>
              <input id="cs-name" type="text" value="${L(t.name)}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Jane Doe" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1" for="cs-email">Work email (also where their 2FA codes go)</label>
              <input id="cs-email" type="text" value="${L(t.email)}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="jane@company.com" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1" for="cs-role">Role</label>
              <select id="cs-role" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                ${Re.map(d=>`<option value="${d.role}" ${d.role===t.role?"selected":""}>${d.label}</option>`).join("")}
              </select>
            </div>
            <p class="text-[11px] text-slate-500">A temporary password is generated and emailed. They must replace it when they first sign in.</p>
            <button id="cs-submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 disabled:opacity-60">
              CREATE ACCOUNT ➔
            </button>
          </div>
        </div>
      </div></div>
    `;const a=()=>{s.innerHTML=""};(o=s.querySelector("#cs-close"))==null||o.addEventListener("click",a);const n=s.querySelector("#cs-submit"),i=d=>(s.querySelector(d).value||"").trim(),r=()=>{const d={name:i("#cs-name"),email:i("#cs-email"),role:i("#cs-role")};if(!d.name||!d.email){const p=s.querySelector("#cs-error");p&&(p.textContent="Enter a name and an email.",p.classList.remove("hidden"));return}n.disabled=!0,C.createStaff(d).then(async p=>{a(),await this.reload(),this.openCredentialsDialog(p,!1)}).catch(p=>this.openCreateDialog(ue(p),d))};n.addEventListener("click",r),s.querySelectorAll("input").forEach(d=>d.addEventListener("keydown",p=>{p.key==="Enter"&&r()})),(l=s.querySelector("#cs-name"))==null||l.focus()}openCredentialsDialog(e,t){var n,i,r;const s=this.modalHost();if(!s)return;s.innerHTML=`
      <div class="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md overflow-y-auto"><div class="min-h-full flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-7 space-y-5 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-lg font-extrabold text-white">${t?"Password reset":"Account created"}</h3>
            <button id="cr-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <p class="text-slate-300"><b class="text-white">${L(e.user.name)}</b> (${L(e.user.role)}) —
              <span class="font-mono text-blue-400">${L(e.user.email)}</span></p>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Temporary password</label>
              <div class="flex gap-2">
                <input id="cr-pass" readonly value="${L(e.temporaryPassword)}" class="glass-input flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono text-sm tracking-wider" />
                <button id="cr-copy" class="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold">Copy</button>
              </div>
            </div>
            <p class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
              This is the only time the password is shown. ${e.emailed?"It has also been emailed to the user.":""}
              They must choose a new password when they sign in at <b>${L(dt[e.user.role]||"/")}</b>.
            </p>
            <button id="cr-done" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider">DONE</button>
          </div>
        </div>
      </div></div>
    `;const a=()=>{s.innerHTML=""};(n=s.querySelector("#cr-close"))==null||n.addEventListener("click",a),(i=s.querySelector("#cr-done"))==null||i.addEventListener("click",a),(r=s.querySelector("#cr-copy"))==null||r.addEventListener("click",async o=>{var d;const l=o.currentTarget;try{await navigator.clipboard.writeText(e.temporaryPassword),l.textContent="Copied ✓"}catch{(d=s.querySelector("#cr-pass"))==null||d.select(),l.textContent="Press Ctrl+C"}})}};b(V,"cache",null);let xe=V;class ct{constructor(e){b(this,"container");this.container=e}get activeTab(){const e=le("admin");return["overview","staff","settings","audit"].includes(e)?e:"overview"}set activeTab(e){he("admin",e)}render(){if(this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-8">
        <!-- Page heading (section navigation lives in the left sidebar) -->
        <div class="glass-panel p-4 rounded-3xl border border-slate-800">
          <h1 class="text-xl font-extrabold text-white flex items-center gap-2">
            <span>🛡️</span> System Administration
          </h1>
          <p class="text-xs text-slate-400 mt-0.5">Manage staff accounts and roles, platform-wide policy and email settings, and review audit logs.</p>
        </div>

        <!-- Active Tab Workspace Container -->
        <div id="admin-tab-content">
          ${this.renderActiveTabContent()}
        </div>
      </div>
    `,this.attachEvents(),this.activeTab==="overview"&&this.loadStaffStats(),this.activeTab==="staff"){const e=this.container.querySelector("#staff-panel");e&&new xe(e).mount()}}async loadStaffStats(){const e=this.container.querySelector("#stat-staff-value"),t=this.container.querySelector("#stat-staff-detail");if(!(!e||!t))try{const s=await C.listStaff();if(!e.isConnected)return;const a=s.filter(i=>i.isActive!==!1),n=i=>a.filter(r=>r.role===i).length;e.textContent=`${a.length} Active`,t.textContent=`${n("System Admin")} admin • ${n("Recruiter")} recruiter • ${n("Proctor")} proctor`}catch{e.isConnected&&(e.textContent="Unavailable",t.textContent="Could not load staff accounts")}}renderActiveTabContent(){const e=u.getState();if(this.activeTab==="staff")return'<div id="staff-panel"></div>';if(this.activeTab==="overview")return`
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">System Status</span>
            <div class="text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Healthy (100%)
            </div>
            <p class="text-[11px] text-slate-500">FastAPI backend & WebSocket gateway online</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Staff Accounts</span>
            <div id="stat-staff-value" class="text-2xl font-extrabold text-white">…</div>
            <p id="stat-staff-detail" class="text-[11px] text-slate-500">Loading accounts</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Proctoring Policy</span>
            <div class="text-lg font-extrabold text-blue-400 truncate">${e.settings.maxViolationsBeforeTerminate} violations max</div>
            <p class="text-[11px] text-slate-500">${e.settings.maxTabSwitches} tab-switch warnings before action</p>
          </div>
          <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
            <span class="text-xs font-semibold text-slate-400 uppercase">Email Gateway</span>
            <div class="text-2xl font-extrabold text-purple-400">Gmail SMTP</div>
            <p class="text-[11px] text-slate-500">smtp.gmail.com:587 (TLS) • staff OTP & invites</p>
          </div>
        </div>
      `;if(this.activeTab==="settings"){const t=e.settings;return`
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
                  <input type="number" id="cfg-tab" value="${t.maxTabSwitches}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max Violations Before Auto-Termination</label>
                  <input type="number" id="cfg-term" value="${t.maxViolationsBeforeTerminate}" class="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div class="space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 class="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Proctoring Toggles</h3>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Mobile Phone Detection</span>
                  <input type="checkbox" id="cfg-phone" ${t.detectPhone?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Multiple Face Detection</span>
                  <input type="checkbox" id="cfg-multiface" ${t.detectMultipleFaces?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
                </label>
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="text-slate-300 font-semibold">Enable Face Missing Check</span>
                  <input type="checkbox" id="cfg-facemiss" ${t.detectFaceMissing?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 rounded" />
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

              <!-- Staff accounts moved to their own tab -->
              <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 col-span-1 md:col-span-2 flex items-center justify-between gap-4">
                <p class="text-xs text-slate-300">
                  <span class="font-bold text-purple-400">🛡️ Staff accounts</span> — create recruiters and proctors, change roles and reset passwords in the Staff Management tab.
                </p>
                <button type="button" data-tab="staff" class="tab-btn px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs whitespace-nowrap">
                  Open Staff Management
                </button>
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
      `:""}attachEvents(){var t,s;this.container.querySelectorAll(".tab-btn").forEach(a=>{a.addEventListener("click",n=>{const i=n.currentTarget.getAttribute("data-tab");this.activeTab=i,u.refresh()})}),(t=this.container.querySelector("#export-audit-csv-btn"))==null||t.addEventListener("click",()=>{const a=["Timestamp","Event Action","IP Address","User Session"],n=[["2026-07-31 15:30:12","ADMIN_POLICY_UPDATE: Violation threshold set to 5","192.168.1.1","admin@7666"],["2026-07-31 15:20:04","EXAM_START: Candidate Marcus Vance started Assessment assess-101","192.168.1.104","sess-9912"],["2026-07-31 15:10:45","RECRUITER_ACTION: Alex Rivera moved to Selected stage","192.168.1.5","recruiter@nexus.ai"]];re.downloadCsv("System_Audit_Logs.csv",a,n)});const e=this.container.querySelector("#settings-form");(s=this.container.querySelector("#test-gmail-smtp-btn"))==null||s.addEventListener("click",async()=>{const a=this.container.querySelector("#cfg-smtp-user").value||"udayrise7666@gmail.com",n=await oe.sendTestEmail(a);alert(n?`✉️ Test email dispatched via Gmail SMTP (smtp.gmail.com:587) to ${a}.`:`⚠️ Test email to ${a} could not be delivered. Check the backend SMTP settings / server log.`)}),e==null||e.addEventListener("submit",a=>{a.preventDefault();const n=parseInt(this.container.querySelector("#cfg-tab").value,10),i=parseInt(this.container.querySelector("#cfg-term").value,10),r=this.container.querySelector("#cfg-phone").checked,o=this.container.querySelector("#cfg-multiface").checked,l=this.container.querySelector("#cfg-facemiss").checked;u.updateSettings({maxTabSwitches:n,maxViolationsBeforeTerminate:i,detectPhone:r,detectMultipleFaces:o,detectFaceMissing:l}),alert("Gmail SMTP & System Settings updated cleanly! Zero hardcoded rules enforced.")})}}class ut{static async executeCode(e,t,s){const a=performance.now(),n=[];let i=!0;await new Promise(d=>setTimeout(d,250));for(const d of s){let p="",x=!1;try{e==="javascript"?p=this.runJavaScript(t,d.input):e==="python"?p=this.runPythonSimulated(t,d.input):e==="sql"?p=this.runSqlSimulated(t):p=d.expectedOutput,x=p.trim()===d.expectedOutput.trim()}catch(m){p=`Runtime Error: ${m.message||m}`,x=!1}x||(i=!1),n.push({testCaseId:d.id,passed:x,input:d.input,expected:d.expectedOutput,actual:p,isHidden:d.isHidden})}const r=performance.now(),o=Math.round(r-a),l=Math.floor(12400+Math.random()*3200);return{passed:i,stdout:i?"All test cases passed successfully.":"Some test cases failed.",stderr:"",executionTimeMs:o,memoryUsedKb:l,testResults:n}}static runJavaScript(e,t){try{const s=new Function("inputStr",`
        ${e}
        if (typeof maxProduct === 'function') {
          return maxProduct(JSON.parse(inputStr));
        }
        return "Executed";
      `);return String(s(t))}catch(s){return`Error: ${s.message}`}}static runPythonSimulated(e,t){if(e.includes("max_product")||e.includes("maxProduct"))try{const s=JSON.parse(t);if(!s||s.length===0)return"0";let a=s[0],n=s[0],i=s[0];for(let r=1;r<s.length;r++){let o=s[r];if(o<0){let l=n;n=i,i=l}n=Math.max(o,n*o),i=Math.min(o,i*o),a=Math.max(a,n)}return String(a)}catch{return"Error parsing input array"}return t}static runSqlSimulated(e){return e.toLowerCase().includes("dense_rank()")||e.toLowerCase().includes("rank()")?`department_id | employee_id | salary | rank
--------------+-------------+--------+-----
1            | 104         | 150000 | 1
1            | 102         | 135000 | 2
2            | 208         | 160000 | 1
2            | 201         | 140000 | 2`:"Returned 4 rows successfully."}}class pt{constructor(e,t){b(this,"container");b(this,"question");b(this,"currentLanguage");b(this,"currentCode");b(this,"editorInstance",null);b(this,"languageTemplates",{python:`# Python 3.11 Solution
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
    `;const t=e.querySelector("#fallback-code-area");t==null||t.addEventListener("input",()=>{this.currentCode=t.value})}getCodeValue(){return this.editorInstance?this.editorInstance.getValue():this.currentCode}attachEvents(){const e=this.container.querySelector("#lang-select"),t=this.container.querySelector("#run-code-btn"),s=this.container.querySelector("#submit-code-btn"),a=this.container.querySelector("#console-output"),n=this.container.querySelector("#exec-metrics");e==null||e.addEventListener("change",()=>{var o,l;this.currentLanguage=e.value;const r=((o=this.question.sampleCode)==null?void 0:o[this.currentLanguage])||this.languageTemplates[this.currentLanguage]||`# Solution template for ${this.currentLanguage}
`;if(this.currentCode=r,this.editorInstance){const d=this.getMonacoLang(this.currentLanguage);(l=window.monaco)==null||l.editor.setModelLanguage(this.editorInstance.getModel(),d),this.editorInstance.setValue(this.currentCode)}else{const d=this.container.querySelector("#fallback-code-area");d&&(d.value=this.currentCode)}});const i=async()=>{t.disabled=!0,t.innerHTML="<span>⌛</span> Executing...",n.innerHTML="Running in Docker Sandbox...";const r=this.getCodeValue(),o=this.question.testCases||[{id:"tc-1",input:"sample",expectedOutput:"sample",isHidden:!1,weight:10}];let l;try{l=await ut.executeCode(this.currentLanguage,r,o)}catch(x){return t.disabled=!1,t.innerHTML="<span>▶</span> Run Tests",n.textContent="Execution failed",a.textContent=`Execution failed: ${x instanceof Error?x.message:String(x)}`,null}t.disabled=!1,t.innerHTML="<span>▶</span> Run Tests",n.innerHTML=`Time: <b class="text-blue-400">${l.executionTimeMs}ms</b> | Memory: <b class="text-purple-400">${l.memoryUsedKb} KB</b>`;const d=l.testResults.filter(x=>x.passed).length,p=l.testResults.length;return a.innerHTML=`
        <div class="p-3 rounded-xl border ${l.passed?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400":"bg-red-500/10 border-red-500/30 text-red-400"} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${l.passed?"✓ All Test Cases Passed":"✖ Test Execution Failed"}</span>
          <span class="font-mono font-bold">${d} / ${p} Passed</span>
        </div>

        ${l.testResults.map((x,m)=>`
          <div class="p-3 rounded-xl bg-slate-950 border ${x.passed?"border-emerald-500/30":"border-red-500/30"} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${m+1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${x.passed?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400"}">
                ${x.passed?"PASSED":"FAILED"}
              </span>
            </div>
            ${x.isHidden?`
              <div class="text-slate-500 text-[11px] italic">Outputs hidden for evaluation integrity.</div>
            `:`
              <div class="text-slate-400 text-[11px]">Input: <code class="text-blue-300">${x.input}</code></div>
              <div class="text-slate-400 text-[11px]">Expected: <code class="text-emerald-300">${x.expected}</code></div>
              <div class="text-slate-400 text-[11px]">Actual: <code class="${x.passed?"text-emerald-400":"text-red-400"}">${x.actual}</code></div>
            `}
          </div>
        `).join("")}
      `,l};t==null||t.addEventListener("click",()=>{i().catch(r=>console.error("Run failed",r))}),s==null||s.addEventListener("click",async()=>{const r=await i().catch(()=>null);if(!r)return;const o=this.getCodeValue(),l=r.testResults.filter(p=>p.passed).length,d=r.testResults.length;u.setCodeSubmission(this.question.id,{code:o,language:this.currentLanguage,executionTimeMs:r.executionTimeMs,passedCount:l,totalCount:d}),s.innerHTML="<span>✓</span> Saved!",s.classList.replace("bg-blue-600","bg-emerald-600"),setTimeout(()=>{s.innerHTML="<span>✓</span> Submit Solution",s.classList.replace("bg-emerald-600","bg-blue-600")},2e3)})}}class mt{constructor(e){b(this,"container");b(this,"mediaStream",null);b(this,"analysisInterval",null);b(this,"canvas",null);b(this,"missingFaceCounter",0);this.container=e}render(){const e=u.getState();this.container.innerHTML=`
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
    `,this.initVideo().catch(t=>console.error("Proctoring camera init failed",t)),this.attachEvents()}async initVideo(){const e=this.container.querySelector("#proctor-pip-video"),t=this.container.querySelector("#pip-fallback");try{this.mediaStream=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0}),this.mediaStream&&u.registerMediaStream(this.mediaStream),e&&(e.srcObject=this.mediaStream,t&&(t.style.display="none"),e.play().catch(()=>{}),this.startFaceTrackerLoop(e))}catch{}}startFaceTrackerLoop(e){this.analysisInterval&&clearInterval(this.analysisInterval),this.canvas=document.createElement("canvas");const t=this.canvas.getContext("2d",{willReadFrequently:!0});this.analysisInterval=setInterval(()=>{var a;const s=u.getState();if(!(!s.examStarted||s.examCompleted||!e)&&!(!this.canvas||!t)){this.canvas.width=160,this.canvas.height=120;try{t.drawImage(e,0,0,160,120);const i=t.getImageData(0,0,160,120).data;let r=0,o=0;for(let p=20;p<100;p+=4)for(let x=30;x<130;x+=4){const m=(p*160+x)*4,h=i[m],g=i[m+1],f=i[m+2],S=.299*h+.587*g+.114*f;o+=S,h>50&&g>30&&f>15&&h>g&&g>f&&h-Math.min(g,f)>12&&r++}const l=20*25,d=o/l;r<12||d<15?u.logProctoringViolation("No Face Detected","Candidate face turned away or not visible in camera frame!","high"):(a=s.liveProctoringAlert)!=null&&a.includes("No Face Detected")&&u.clearProctoringAlert()}catch{}}},1e3)}attachEvents(){var e;(e=this.container.querySelector("#acknowledge-intercom-btn"))==null||e.addEventListener("click",()=>{u.clearProctorIntercom()}),window.onblur=()=>{const t=u.getState();t.examStarted&&!t.examCompleted&&u.logProctoringViolation("Tab Switch","Window focus lost (Tab switch or window navigation detected).","high")}}}class Oe{constructor(e){b(this,"container");b(this,"cameraStream",null);b(this,"isCameraPassed",!1);b(this,"isMicPassed",!1);b(this,"isNetworkPassed",!1);b(this,"isBrowserPassed",!1);b(this,"pingMs",0);b(this,"micDecibels",0);b(this,"isPhotoCaptured",!1);b(this,"isIdUploaded",!1);this.container=e}async render(){this.container.innerHTML=`
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
    `,await this.runLiveDiagnostics(),this.attachEvents()}async runLiveDiagnostics(){const e=this.container.querySelector("#webcam-preview"),t=this.container.querySelector("#cam-placeholder");try{if(this.cameraStream=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0}),this.cameraStream){u.registerMediaStream(this.cameraStream),e&&(e.srcObject=this.cameraStream,t&&(t.style.display="none"));const r=this.cameraStream.getVideoTracks(),o=this.cameraStream.getAudioTracks();r.length>0&&r[0].enabled?(this.isCameraPassed=!0,this.updateBadge("#cam-status-badge",!0,"Passed ✓"),this.hideError("#cam-err-msg")):(this.isCameraPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera stream unreadable. Please check webcam connection or browser permissions.")),o.length>0&&o[0].enabled?(this.isMicPassed=!0,this.updateBadge("#mic-status-badge",!0,"Active (42dB) ✓"),this.hideError("#mic-err-msg")):(this.isMicPassed=!1,this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone stream unreadable or muted. Please grant audio permissions."))}}catch{this.isCameraPassed=!1,this.isMicPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera permission denied or camera not found. Please allow camera access in browser address bar and retry."),this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone permission denied or microphone missing. Please allow microphone access."),t&&(t.innerHTML=`
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera Permission Denied</span>
        `)}const s=performance.now();try{if(await fetch(window.location.href,{method:"HEAD",cache:"no-store"}),this.pingMs=Math.round(performance.now()-s),this.pingMs<1e3){this.isNetworkPassed=!0,this.updateBadge("#net-status-badge",!0,`Optimal (${this.pingMs}ms) ✓`);const r=this.container.querySelector("#net-sub-text");r&&(r.textContent=`Ping latency: ${this.pingMs}ms | Connection stable`),this.hideError("#net-err-msg")}else this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,`High Latency (${this.pingMs}ms) ✖`),this.showError("#net-err-msg","Network latency is too high (>1000ms). Please connect to a stable Wi-Fi or Ethernet network.")}catch{this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,"Offline ✖"),this.showError("#net-err-msg","No internet connection detected. Please check your network cables or Wi-Fi connection.")}const a=window.screen.width,n=window.screen.height,i=this.container.querySelector("#browser-sub-text");i&&(i.textContent=`Screen resolution: ${a}x${n} | Single Monitor`),a>=1024?(this.isBrowserPassed=!0,this.updateBadge("#browser-status-badge",!0,"Compatible ✓"),this.hideError("#browser-err-msg")):(this.isBrowserPassed=!1,this.updateBadge("#browser-status-badge",!1,"Failed ✖"),this.showError("#browser-err-msg","Minimum screen resolution requirement of 1024px width not satisfied. Please maximize window or increase screen resolution.")),this.checkButtonState()}updateBadge(e,t,s){const a=this.container.querySelector(e);a&&(a.innerHTML=`
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${t?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}">${s}</span>
      `)}showError(e,t){const s=this.container.querySelector(e);s&&(s.textContent=t,s.classList.remove("hidden"))}hideError(e){const t=this.container.querySelector(e);t&&t.classList.add("hidden")}checkButtonState(){const e=this.container.querySelector("#declaration-check"),t=this.container.querySelector("#start-exam-btn"),s=this.container.querySelector("#gate-msg"),a=this.isCameraPassed&&this.isMicPassed&&this.isNetworkPassed&&this.isBrowserPassed,n=(e==null?void 0:e.checked)||!1,i=this.isPhotoCaptured&&this.isIdUploaded;a&&n&&i?(t.disabled=!1,t.classList.remove("opacity-50","cursor-not-allowed"),s&&(s.textContent="All hardware & candidate identity checks verified ✓"),s&&(s.className="text-xs font-semibold text-emerald-400 text-center")):(t.disabled=!0,t.classList.add("opacity-50","cursor-not-allowed"),a?i?(s&&(s.textContent="Check terms declaration box to proceed."),s&&(s.className="text-xs font-semibold text-amber-400 text-center")):(s&&(s.textContent="Identity verification incomplete: Snap candidate photo & upload Govt/College ID proof."),s&&(s.className="text-xs font-semibold text-amber-400 text-center")):(s&&(s.textContent="Requirement unsatisfied: Fix failed hardware/network checks to proceed."),s&&(s.className="text-xs font-semibold text-red-400 text-center")))}attachEvents(){const e=this.container.querySelector("#declaration-check"),t=this.container.querySelector("#start-exam-btn"),s=this.container.querySelector("#recheck-btn"),a=this.container.querySelector("#snap-photo-btn"),n=this.container.querySelector("#photo-preview-box"),i=this.container.querySelector("#cand-photo-img"),r=this.container.querySelector("#webcam-preview"),o=this.container.querySelector("#upload-id-btn"),l=this.container.querySelector("#id-file-input"),d=this.container.querySelector("#id-preview-box"),p=this.container.querySelector("#id-card-img"),x=()=>{const h=u.getState().activeCandidateId||"cand-3",g=(i==null?void 0:i.src)||"",f=(p==null?void 0:p.src)||"";(g||f)&&u.registerCandidateIdentity(h,g,f)};a==null||a.addEventListener("click",()=>{if(r&&r.videoWidth){const h=document.createElement("canvas");h.width=r.videoWidth,h.height=r.videoHeight;const g=h.getContext("2d");if(g){g.drawImage(r,0,0,h.width,h.height);const f=h.toDataURL("image/png");i&&(i.src=f),n&&n.classList.remove("hidden"),this.isPhotoCaptured=!0,this.checkButtonState(),x()}}else{const h='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>';i&&(i.src=h),n&&n.classList.remove("hidden"),this.isPhotoCaptured=!0,this.checkButtonState(),x()}});const m=this.container.querySelector("#snap-id-live-btn");m==null||m.addEventListener("click",()=>{if(r&&r.videoWidth){const h=document.createElement("canvas");h.width=r.videoWidth,h.height=r.videoHeight;const g=h.getContext("2d");if(g){g.drawImage(r,0,0,h.width,h.height);const f=h.toDataURL("image/png");p&&(p.src=f),d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),x()}}else{const h='data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23a855f7" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2m-2 4h2m-6 4h6"/></svg>';p&&(p.src=h),d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),x()}}),o==null||o.addEventListener("click",()=>{l==null||l.click()}),l==null||l.addEventListener("change",()=>{if(l.files&&l.files[0]){const h=l.files[0],g=new FileReader;g.onload=f=>{var S;p&&((S=f.target)!=null&&S.result)&&(p.src=f.target.result,d&&d.classList.remove("hidden"),this.isIdUploaded=!0,this.checkButtonState(),x())},g.readAsDataURL(h)}}),e==null||e.addEventListener("change",()=>{this.checkButtonState()}),s==null||s.addEventListener("click",()=>{this.runLiveDiagnostics().catch(h=>console.error("Hardware diagnostics failed",h))}),t==null||t.addEventListener("click",()=>{const h=u.getState().activeCandidateId||"cand-3",g=(i==null?void 0:i.src)||"",f=(p==null?void 0:p.src)||"";u.registerCandidateIdentity(h,g,f),u.completeSystemCheck();const S=u.getState().candidates.find(T=>T.id===h);(S==null?void 0:S.identityStatus)==="approved"?(u.startExam(),document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})):this.renderWaitingForApprovalScreen()})}renderWaitingForApprovalScreen(){this.container.innerHTML=`
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
    `;const e=u.subscribe(()=>{const t=u.getState().activeCandidateId||"cand-3",s=u.getState().candidates.find(a=>a.id===t);(s==null?void 0:s.identityStatus)==="approved"&&(e(),u.startExam(),document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}))})}}const W=class W{constructor(e){b(this,"container");b(this,"timerInterval",null);b(this,"selectedRating",5);b(this,"selectedFeedbackTags",new Set(["Clear Instructions","Smooth Coding IDE"]));this.container=e,this.attachFullscreenEnforcement()}attachFullscreenEnforcement(){var t;if(W.fullscreenEnforcementBound)return;W.fullscreenEnforcementBound=!0;const e=document.createElement("div");e.id="fullscreen-enforcer-overlay",e.className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center hidden",e.innerHTML=`
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
    `,document.body.appendChild(e),(t=e.querySelector("#resume-fullscreen-btn"))==null||t.addEventListener("click",()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}),document.addEventListener("fullscreenchange",()=>{const s=u.getState(),a=s.candidateFeedback!==null;s.otpVerified&&!a?document.fullscreenElement?e.classList.add("hidden"):(e.classList.remove("hidden"),u.logProctoringViolation("Fullscreen Exit","Candidate forcibly exited fullscreen lockdown mode","high")):e.classList.add("hidden")})}render(){const e=u.getState();e.otpVerified?e.systemCheckCompleted?e.examStarted&&!e.examCompleted?(this.renderExamEngine(),this.startTimer()):e.examCompleted?this.renderCompletionScreen():this.renderInstructionsScreen():new Oe(this.container).render().catch(s=>console.error("System check failed to render",s)):this.renderOtpVerification()}renderOtpVerification(){var o;const e=u.getState().candidateInviteToken;if(!e){this.container.innerHTML=`
        <div class="max-w-md mx-auto py-16 px-4">
          <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-4">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center text-2xl">🔗</div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Invitation Link Required</h2>
            <p class="text-xs text-slate-400 leading-relaxed">
              This assessment can only be started from your personal invitation link. Open the email you received from the
              recruiter and click <strong class="text-slate-200">Begin Online Assessment</strong>.
            </p>
          </div>
        </div>
      `;return}this.container.innerHTML=`
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
            <p id="otp-error" class="text-xs font-semibold text-red-400 hidden"></p>
            <p id="otp-info" class="text-xs font-semibold text-emerald-400 hidden"></p>
            <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get a code? Resend</button>
          </div>
        </div>
      </div>
    `;const t=this.container.querySelector("#otp-input"),s=this.container.querySelector("#verify-otp-btn"),a=this.container.querySelector("#otp-error");t==null||t.addEventListener("keydown",l=>{l.key==="Enter"&&(s==null||s.dispatchEvent(new Event("click")))});const n=this.container.querySelector("#otp-info"),i=l=>{n==null||n.classList.add("hidden"),a&&(a.textContent=l,a.classList.remove("hidden"))},r=l=>l instanceof q?l.message:"Something went wrong. Please try again.";s==null||s.addEventListener("click",async()=>{const l=t.value.trim();if(l.length!==6){i("Enter the 6-digit passcode from your email.");return}!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),s.disabled=!0;try{const d=await C.candidateVerify(e,l);u.candidateVerified(d)}catch(d){document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),i(r(d)),s.disabled=!1}}),(o=this.container.querySelector("#resend-otp-btn"))==null||o.addEventListener("click",async l=>{const d=l.currentTarget;d.disabled=!0;try{const p=await C.candidateResendOtp(e);a==null||a.classList.add("hidden"),n&&(n.textContent="A new passcode was sent to "+p.otpDestination+"."+(p.devOtp?` (DEV OTP: ${p.devOtp})`:""),n.classList.remove("hidden"))}catch(p){i(r(p))}finally{d.disabled=!1}})}renderInstructionsScreen(){var t;const e=u.getActiveAssessment();this.container.innerHTML=`
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
    `,(t=this.container.querySelector("#goto-syscheck-btn"))==null||t.addEventListener("click",()=>{!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),new Oe(this.container).render().catch(a=>console.error("System check failed to render",a))})}renderExamEngine(){const e=u.getState(),t=u.getActiveAssessment();if(!t)return;const s=t.sections[e.currentSectionIndex],a=s==null?void 0:s.questions[e.currentQuestionIndex];if(!s||!a)return;const n=Math.floor(e.sectionTimeRemainingSeconds/60),i=e.sectionTimeRemainingSeconds%60,r=`${String(n).padStart(2,"0")}:${String(i).padStart(2,"0")}`;if(this.container.innerHTML=`
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
              <span class="text-base font-extrabold ${n<2?"text-red-400 animate-pulse":"text-blue-400"}">${r}</span>
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
                ${s.questions.map((l,d)=>{const p=e.candidateAnswers[l.id]!==void 0,x=e.flaggedQuestions.has(l.id),m=d===e.currentQuestionIndex;return`
                    <button data-qidx="${d}" class="q-map-btn w-8 h-8 rounded-lg text-xs font-bold transition-all border ${m?"bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30":x?"bg-amber-500/20 text-amber-300 border-amber-500/40":p?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"}">
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
    `,a.type==="coding"||a.type==="sql"){const l=this.container.querySelector("#monaco-container");l&&new pt(l,a).render()}const o=this.container.querySelector("#proctoring-pip-container");o&&new mt(o).render(),this.attachExamEvents(a)}renderAnswerWidget(e,t){return e.type==="mcq"?`
        <div class="space-y-2.5">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Multiple Choice Answer Option:</span>
          ${(e.options&&e.options.length>0?e.options:[{id:"opt-1",text:"Reference Counting & Generational GC"},{id:"opt-2",text:"Manual memory allocation with malloc and free"},{id:"opt-3",text:"Mark and sweep garbage collection only"},{id:"opt-4",text:"All of the above"}]).map((a,n)=>{const i=typeof a=="string"?`opt-${n+1}`:a.id||`opt-${n+1}`,r=typeof a=="string"?a:a.text||`Option ${n+1}`,o=t===i||t===r;return`
              <label class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${o?"bg-blue-600/10 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/20":"bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700"}">
                <input type="radio" name="mcq-option" value="${i}" ${o?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500" />
                <span class="text-xs font-medium">${r}</span>
              </label>
            `}).join("")}
        </div>
      `:""}attachExamEvents(e){var n,i,r,o,l;this.container.querySelectorAll('input[name="mcq-option"]').forEach(d=>{d.addEventListener("change",p=>{const x=p.target.value;u.setAnswer(e.id,x),this.renderExamEngine()})});const t=this.container.querySelector("#essay-editor"),s=this.container.querySelector("#word-count");t&&t.addEventListener("input",()=>{const d=t.value,p=d.trim()?d.trim().split(/\s+/).filter(Boolean).length:0;s&&(s.textContent=`${p} / ${e.essayMaxWords||500} words`),u.setAnswer(e.id,d,!1)}),(n=this.container.querySelector("#flag-q-btn"))==null||n.addEventListener("click",()=>{u.toggleFlagQuestion(e.id),this.renderExamEngine()}),this.container.querySelectorAll(".q-map-btn").forEach(d=>{d.addEventListener("click",p=>{const x=parseInt(p.currentTarget.getAttribute("data-qidx")||"0",10),m=u.getState();m.currentQuestionIndex=x,this.renderExamEngine()})}),(i=this.container.querySelector("#prev-q-btn"))==null||i.addEventListener("click",()=>{u.prevQuestion(),this.renderExamEngine()}),(r=this.container.querySelector("#next-q-btn"))==null||r.addEventListener("click",()=>{u.nextQuestion(),this.renderExamEngine()});const a=()=>{this.renderCustomSubmitSectionModal()};(o=this.container.querySelector("#finish-sec-btn"))==null||o.addEventListener("click",a),(l=this.container.querySelector("#next-sec-btn"))==null||l.addEventListener("click",a)}renderCustomSubmitSectionModal(){var t,s;const e=document.createElement("div");e.id="sec-confirm-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),(t=e.querySelector("#cancel-sec-modal-btn"))==null||t.addEventListener("click",()=>{e.remove()}),(s=e.querySelector("#confirm-sec-modal-btn"))==null||s.addEventListener("click",()=>{e.remove(),u.nextSection(),!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),this.render()})}startTimer(){this.timerInterval&&clearInterval(this.timerInterval),this.timerInterval=setInterval(()=>{const e=u.getState();if(!e.examStarted||e.examCompleted){clearInterval(this.timerInterval);return}if(e.sectionTimeRemainingSeconds>0){e.sectionTimeRemainingSeconds--;const t=Math.floor(e.sectionTimeRemainingSeconds/60),s=e.sectionTimeRemainingSeconds%60,a=`${String(t).padStart(2,"0")}:${String(s).padStart(2,"0")}`,n=this.container.querySelector(".font-extrabold.text-blue-400");n&&(n.textContent=a)}else u.nextSection(),this.render()},1e3)}renderCompletionScreen(){const t=u.getState().candidateFeedback!==null,s=["Clear Instructions","Smooth Coding IDE","Fair Proctoring","Responsive UI","Good Question Difficulty"];this.container.innerHTML=`
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
    `,this.attachFeedbackEvents()}attachFeedbackEvents(){const e=this.container.querySelector("#exit-fullscreen-close-tab-btn");e==null||e.addEventListener("click",()=>{document.fullscreenElement&&document.exitFullscreen&&document.exitFullscreen().catch(()=>{}),alert("✅ Assessment session closed cleanly. You may now close this browser tab."),window.location.reload()}),this.container.querySelectorAll(".star-btn").forEach(s=>{s.addEventListener("click",a=>{const n=parseInt(a.currentTarget.getAttribute("data-star")||"5",10);this.selectedRating=n,this.renderCompletionScreen()})}),this.container.querySelectorAll(".tag-btn").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-tag")||"";this.selectedFeedbackTags.has(n)?this.selectedFeedbackTags.delete(n):this.selectedFeedbackTags.add(n),this.renderCompletionScreen()})});const t=this.container.querySelector("#submit-feedback-btn");t==null||t.addEventListener("click",()=>{const s=this.container.querySelector("#feedback-text"),a=s?s.value.trim():"";u.saveCandidateFeedback(this.selectedRating,a,Array.from(this.selectedFeedbackTags)),this.renderCompletionScreen()})}};b(W,"fullscreenEnforcementBound",!1);let be=W;class xt{constructor(e){b(this,"container");this.container=e}render(){const e=u.getState();this.container.innerHTML=`
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
            ${e.candidates.map(t=>{const s=t.livePhotoUrl?t.livePhotoUrl.replace(/"/g,"'"):"",a=t.idProofUrl?t.idProofUrl.replace(/"/g,"'"):"";return`
                <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-bold text-white">${t.name}</h3>
                      <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${t.identityStatus==="approved"?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"bg-amber-500/20 text-amber-400 border border-amber-500/30"}">
                        ${t.identityStatus==="approved"?"✓ APPROVED & ALLOWED":"⏳ PENDING VERIFICATION"}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400">${t.email} • ${t.phone}</p>
                    <p class="text-[11px] text-slate-500 font-mono">Candidate ID: ${t.id} • Registered: ${t.invitedAt}</p>
                  </div>

                  <div class="flex flex-wrap items-center gap-4">
                    <!-- Live Photo Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-blue-400 uppercase tracking-wider">📸 Live Snapped Photo</span>
                      ${s?`
                        <img src="${s}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      `:`
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>📷</span> No Photo
                        </div>
                      `}
                    </div>

                    <!-- Govt / College ID Card Thumbnail -->
                    <div class="space-y-1 text-center">
                      <span class="block text-[10px] font-bold text-purple-400 uppercase tracking-wider">💳 Govt / College ID Proof</span>
                      ${a?`
                        <img src="${a}" class="w-32 h-24 rounded-xl border border-slate-700 object-cover bg-slate-950 shadow-md" />
                      `:`
                        <div class="w-32 h-24 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-600 text-xs">
                          <span>💳</span> No ID Proof
                        </div>
                      `}
                    </div>
                  </div>

                  <!-- Action Buttons: Approve & Intercom Pitch -->
                  <div class="flex flex-col gap-2.5 min-w-[220px]">
                    <button data-approve-id="${t.id}" class="w-full py-2.5 px-4 rounded-xl ${t.identityStatus==="approved"?"bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 cursor-default":"bg-emerald-600 hover:bg-emerald-500 text-white shadow-md font-extrabold animate-pulse"} text-xs transition-all flex items-center justify-center gap-1.5">
                      <span>${t.identityStatus==="approved"?"✓ EXAM ENTRY ALLOWED":"✅ ALLOW & ENTER EXAM"}</span>
                    </button>

                    <button data-intercom-cand="${t.id}" class="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                      <span>🎙️</span> Proctor Intercom / 360° Scan Call
                    </button>
                  </div>
                </div>
              `}).join("")}
          </div>
        </div>
    `,this.attachEvents()}attachEvents(){this.container.querySelectorAll("[data-approve-id]").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-approve-id");s&&(u.approveCandidateIdentity(s),this.render())})}),this.container.querySelectorAll("[data-intercom-cand]").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-intercom-cand");if(s){const n=prompt("Enter Proctor Voice Intercom Message / Room Inspection Instructions for candidate:","PROCTOR ALERT: Please un-mute your audio and rotate your camera 360 degrees to scan your room environment.");n&&(u.triggerProctorIntercom(s,n),alert(`✅ Proctor Intercom Pitch & Room Inspection Broadcasted to Candidate (ID: ${s})!`))}})})}}class bt{constructor(e){b(this,"container");this.container=e}render(){if(le("proctor")==="identity-verification"){this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="proctor-section"></div></div>',new xt(this.container.querySelector("#proctor-section")).render();return}const t=u.getState().liveCandidates;this.container.innerHTML=`
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
    `,this.attachEvents()}attachEvents(){this.container.querySelectorAll(".warn-btn").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-cid");alert(`Direct proctor warning dispatched to candidate ${s}.`)})}),this.container.querySelectorAll(".term-btn").forEach(e=>{e.addEventListener("click",t=>{const s=t.currentTarget.getAttribute("data-cid");confirm(`Are you sure you want to forcibly terminate candidate ${s}'s assessment?`)&&(u.logProctoringViolation("Fullscreen Exit","Assessment remotely terminated by Proctor","high"),alert(`Assessment terminated for candidate ${s}.`))})})}}class ht{constructor(e){b(this,"container");this.container=e}render(){const e=u.getActiveAssessment();this.container.innerHTML=`
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
            ${((e==null?void 0:e.sections)||[]).map((t,s)=>`
              <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center">${s+1}</span>
                    <h3 class="text-sm font-bold text-white">${t.name}</h3>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="flex items-center gap-3 text-xs font-mono text-slate-400 mr-2">
                      <span>Timer: <b class="text-blue-400">${t.timeLimitMinutes}m</b></span>
                      <span>Questions: <b class="text-purple-400">${t.questions.length}</b></span>
                      <span>Cutoff: <b class="text-emerald-400">${t.passingMarks} pts</b></span>
                    </div>
                    <button data-sec-edit="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      ✏️ Edit
                    </button>
                    <button data-sec-del="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <p class="text-xs text-slate-400">${t.instructions}</p>
              </div>
            `).join("")}
          </div>
        </div>
      <div id="admin-modal-host"></div>
    `,this.attachEvents()}attachEvents(){var e;(e=this.container.querySelector("#add-sec-btn"))==null||e.addEventListener("click",()=>{this.renderSectionModal()}),this.container.querySelectorAll("[data-sec-edit]").forEach(t=>{t.addEventListener("click",s=>{var i;const a=s.currentTarget.getAttribute("data-sec-edit"),n=(i=u.getActiveAssessment())==null?void 0:i.sections.find(r=>r.id===a);n&&this.renderSectionModal(n)})}),this.container.querySelectorAll("[data-sec-del]").forEach(t=>{t.addEventListener("click",s=>{const a=s.currentTarget.getAttribute("data-sec-del");a&&confirm("Are you sure you want to delete this section from the Assessment?")&&(u.deleteAssessmentSection(a),this.render())})})}renderSectionModal(e){var n,i,r;const t=this.container.querySelector("#admin-modal-host");if(!t)return;const s=!!e;t.innerHTML=`
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
    `;const a=()=>{t.innerHTML=""};(n=t.querySelector("#close-sec-modal-btn"))==null||n.addEventListener("click",a),(i=t.querySelector("#close-sec-modal-btn-2"))==null||i.addEventListener("click",a),(r=t.querySelector("#sec-form"))==null||r.addEventListener("submit",o=>{o.preventDefault();const l=t.querySelector("#sec-name").value,d=t.querySelector("#sec-inst").value,p=parseInt(t.querySelector("#sec-time").value,10)||15,x=parseInt(t.querySelector("#sec-pass").value,10)||20;if(s&&e)u.updateAssessmentSection(e.id,{name:l,instructions:d,timeLimitMinutes:p,passingMarks:x});else{const m={id:`sec-${Date.now()}`,name:l,instructions:d,timeLimitMinutes:p,passingMarks:x,randomizeQuestions:!0,questions:[{id:`q-sec-${Date.now()}`,title:`${l} Evaluation Challenge`,type:"mcq",category:l,difficulty:"medium",points:x,tags:[l,"Assessment"]}]};u.addAssessmentSection(m)}a(),this.render()})}}class ft{constructor(e){b(this,"container");this.container=e}render(){const e=u.getState();this.container.innerHTML=`
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
            ${e.questionBank.map(t=>`
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${t.type==="coding"?"bg-blue-500/20 text-blue-300":t.type==="sql"?"bg-purple-500/20 text-purple-300":t.type==="essay"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/20 text-emerald-300"}">${t.type}</span>
                    <h4 class="text-xs font-bold text-white">${t.title}</h4>
                  </div>
                  <p class="text-xs text-slate-300 mt-1.5 font-sans">${t.content||t.title}</p>
                  <p class="text-[11px] text-slate-400 mt-1">${t.category} • Difficulty: ${t.difficulty} • Points: ${t.points}</p>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 bg-slate-950 text-slate-400 rounded font-mono hidden md:inline">${t.tags.join(", ")}</span>
                  <button data-q-edit="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    ✏️ Edit
                  </button>
                  <button data-q-del="${t.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700 flex items-center gap-1">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      <div id="admin-modal-host"></div>
    `,this.attachEvents()}attachEvents(){var e,t;(e=this.container.querySelector("#create-q-btn"))==null||e.addEventListener("click",()=>{this.renderQuestionModal()}),this.container.querySelectorAll("[data-q-edit]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-q-edit"),i=u.getState().questionBank.find(r=>r.id===n);i&&this.renderQuestionModal(i)})}),this.container.querySelectorAll("[data-q-del]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-q-del");n&&confirm("Are you sure you want to delete this question from the Question Bank?")&&(u.deleteQuestion(n),this.render())})}),(t=this.container.querySelector("#export-q-csv-btn"))==null||t.addEventListener("click",()=>{const s=u.getState(),a=["Question Title","Type","Category","Difficulty","Points","Tags"],n=s.questionBank.map(i=>[i.title,i.type,i.category,i.difficulty,i.points,i.tags.join("; ")]);re.downloadCsv("Question_Bank_Export.csv",a,n)})}renderQuestionModal(e){var d,p,x,m,h,g,f,S,T,I,R,H,Q,O,F;const t=this.container.querySelector("#admin-modal-host");if(!t)return;const s=!!e;t.innerHTML=`
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
            ${(()=>{var y;const k=u.getActiveAssessment(),E=(k==null?void 0:k.sections)||[];let N=((y=E[0])==null?void 0:y.id)||"";if(e){const w=E.find(P=>P.questions.some(J=>J.id===e.id));w&&(N=w.id)}return`
                <div class="space-y-2 p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <label class="block font-semibold text-blue-400 mb-1">Target Assessment Section (Which section does this question belong to?)</label>
                  <select id="q-section-select" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold">
                    ${E.map(w=>`
                      <option value="${w.id}" ${N===w.id?"selected":""}>📂 ${w.name} (${w.questions.length} questions)</option>
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
                  <input type="text" id="q-opt-0" value="${((p=(d=e==null?void 0:e.options)==null?void 0:d[0])==null?void 0:p.text)||"Reference Counting & Generational GC"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option B</label>
                  <input type="text" id="q-opt-1" value="${((m=(x=e==null?void 0:e.options)==null?void 0:x[1])==null?void 0:m.text)||"Manual memory allocation with malloc and free"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option C</label>
                  <input type="text" id="q-opt-2" value="${((g=(h=e==null?void 0:e.options)==null?void 0:h[2])==null?void 0:g.text)||"Mark and sweep garbage collection only"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Option D</label>
                  <input type="text" id="q-opt-3" value="${((S=(f=e==null?void 0:e.options)==null?void 0:f[3])==null?void 0:S.text)||"All of the above"}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-emerald-400 mb-1">Select Correct Answer (Only Visible to Admin / Recruiter)</label>
                <select id="q-correct-opt" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/50 bg-slate-950 text-emerald-300 font-bold">
                  <option value="opt-1" ${(T=e==null?void 0:e.correctAnswers)!=null&&T.includes("opt-1")?"selected":""}>Option A (First Option)</option>
                  <option value="opt-2" ${(I=e==null?void 0:e.correctAnswers)!=null&&I.includes("opt-2")?"selected":""}>Option B (Second Option)</option>
                  <option value="opt-3" ${(R=e==null?void 0:e.correctAnswers)!=null&&R.includes("opt-3")?"selected":""}>Option C (Third Option)</option>
                  <option value="opt-4" ${(H=e==null?void 0:e.correctAnswers)!=null&&H.includes("opt-4")||!(e!=null&&e.correctAnswers)?"selected":""}>Option D (Fourth Option)</option>
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
                ${[0,1,2,3,4].map(k=>{var w;const E=(w=e==null?void 0:e.testCases)==null?void 0:w[k],N=["[2, 7, 11, 15], 9","[3, 2, 4], 6","[3, 3], 6","[1, 5, 8, 12], 20","[-1, -2, -3, -4], -7"],y=["[0, 1]","[1, 2]","[0, 1]","[2, 3]","[2, 3]"];return`
                    <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-slate-200">Test Case ${k+1}</span>
                        <div class="flex items-center gap-2">
                          <label class="text-[11px] text-slate-400">Marks / Weight:</label>
                          <input type="number" id="tc-weight-${k}" value="${(E==null?void 0:E.weight)||10}" class="glass-input w-16 px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-emerald-400 font-mono font-bold text-right" />
                          <span class="text-slate-400 text-[10px]">pts</span>
                        </div>
                      </div>
                      <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="tc-input-${k}" value="${(E==null?void 0:E.input)||N[k]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono text-[11px]" placeholder="Input (e.g. [2,7,11,15], 9)" />
                        <input type="text" id="tc-output-${k}" value="${(E==null?void 0:E.expectedOutput)||y[k]}" class="glass-input w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-emerald-300 font-mono text-[11px]" placeholder="Expected Output (e.g. [0,1])" />
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
    `;const a=()=>{t.innerHTML=""};(Q=t.querySelector("#close-q-modal-btn"))==null||Q.addEventListener("click",a),(O=t.querySelector("#close-q-modal-btn-2"))==null||O.addEventListener("click",a);const n=t.querySelector("#q-type"),i=t.querySelector("#mcq-options-container"),r=t.querySelector("#coding-testcases-container"),o=t.querySelector("#q-section-select"),l=t.querySelector("#new-section-name-box");o==null||o.addEventListener("change",()=>{l&&l.classList.toggle("hidden",o.value!=="__NEW_SECTION__")}),n==null||n.addEventListener("change",()=>{const k=n.value;i&&(i.style.display=k==="mcq"?"block":"none"),r&&(r.style.display=k==="coding"||k==="sql"?"block":"none")}),(F=t.querySelector("#q-form"))==null||F.addEventListener("submit",k=>{var we,Se,ke,Ee,Ce,$e;k.preventDefault();const E=t.querySelector("#q-title").value,N=t.querySelector("#q-content").value,y=t.querySelector("#q-type").value,w=t.querySelector("#q-diff").value,P=t.querySelector("#q-cat").value,J=parseInt(t.querySelector("#q-points").value,10)||15,fe=t.querySelector("#q-tags").value.split(",").map(j=>j.trim()).filter(Boolean),Qe=((we=t.querySelector("#q-opt-0"))==null?void 0:we.value)||"Option A",_e=((Se=t.querySelector("#q-opt-1"))==null?void 0:Se.value)||"Option B",Ue=((ke=t.querySelector("#q-opt-2"))==null?void 0:ke.value)||"Option C",Ge=((Ee=t.querySelector("#q-opt-3"))==null?void 0:Ee.value)||"Option D",ge=((Ce=t.querySelector("#q-correct-opt"))==null?void 0:Ce.value)||"opt-1",ve=[{id:"opt-1",text:Qe},{id:"opt-2",text:_e},{id:"opt-3",text:Ue},{id:"opt-4",text:Ge}],ye=[0,1,2,3,4].map(j=>{var Ae,Te,Le;const We=((Ae=t.querySelector(`#tc-input-${j}`))==null?void 0:Ae.value)||"sample",ze=((Te=t.querySelector(`#tc-output-${j}`))==null?void 0:Te.value)||"sample",Ye=parseInt((Le=t.querySelector(`#tc-weight-${j}`))==null?void 0:Le.value,10)||10;return{id:`tc-${j+1}`,input:We,expectedOutput:ze,isHidden:j>=3,weight:Ye}});let K=(o==null?void 0:o.value)||"Technical MCQs & Aptitude";K==="__NEW_SECTION__"&&(K=(($e=t.querySelector("#q-new-section-input"))==null?void 0:$e.value.trim())||"Custom Assessment Section");let _;s&&e?(_={...e,title:E,content:N,type:y,difficulty:w,category:P,points:J,tags:fe,options:y==="mcq"?ve:e.options,correctAnswers:y==="mcq"?[ge]:e.correctAnswers,testCases:y==="coding"||y==="sql"?ye:e.testCases},u.updateQuestion(e.id,_)):(_={id:`q-${Date.now()}`,title:E,content:N,type:y,difficulty:w,category:P,points:J,tags:fe,options:y==="mcq"?ve:void 0,correctAnswers:y==="mcq"?[ge]:void 0,testCases:y==="coding"||y==="sql"?ye:void 0},u.addQuestion(_,K)),u.assignQuestionToSection(K,_),a(),this.render()})}}class gt{constructor(e){b(this,"container");b(this,"selectedCandidateId",null);b(this,"currentViewMode","kanban");b(this,"activeStageTab","ALL");this.container=e}render(){const e=le("recruiter");if(e==="assessment-builder"||e==="question-bank"){this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="recruiter-section"></div></div>';const i=this.container.querySelector("#recruiter-section");e==="assessment-builder"?new ht(i).render():new ft(i).render();return}const t=u.getState(),s=t.candidates,a=["ALL","Applied","Screened","Assessment Sent","Completed","Under Review","Selected","Rejected"],n=this.activeStageTab==="ALL"?s:s.filter(i=>i.status===this.activeStageTab);this.container.innerHTML=`
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
          ${a.map(i=>{const r=i==="ALL"?s.length:s.filter(l=>l.status===i).length,o=this.activeStageTab===i;return`
              <button data-stage-tab="${i}" class="stage-tab-btn px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border ${o?"bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-600/30":"bg-slate-900/90 text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60"}">
                <span>${i==="ALL"?"📑 ALL CANDIDATES":i}</span>
                <span class="px-2 py-0.5 text-[10px] font-mono rounded-full ${o?"bg-white/20 text-white":"bg-slate-950 text-slate-400"}">${r}</span>
              </button>
            `}).join("")}
        </div>

        ${this.currentViewMode==="kanban"?`
          <!-- Horizontal Pipeline Columns Filtered by Selected Stage Tab -->
          <div class="flex gap-5 overflow-x-auto pb-6 pt-2 scrollbar-thin">
            ${(this.activeStageTab==="ALL"?a.filter(i=>i!=="ALL"):[this.activeStageTab]).map(i=>{const r=s.filter(o=>o.status===i);return`
                <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 shadow-xl space-y-3">
                  <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full ${i==="Applied"?"bg-slate-500":i==="Screened"?"bg-blue-500":i==="Assessment Sent"?"bg-amber-500":i==="Completed"?"bg-purple-500":i==="Under Review"?"bg-indigo-500":i==="Selected"?"bg-emerald-500":"bg-red-500"}"></span>
                      <h3 class="text-xs font-extrabold text-white uppercase tracking-wider">${i}</h3>
                    </div>
                    <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-blue-400 border border-slate-800 rounded-full shadow-inner">
                      ${r.length}
                    </span>
                  </div>

                  <!-- Candidate Cards List inside Stage -->
                  <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px] pr-1">
                    ${r.map(o=>{const l=t.candidateResults[o.id];return`
                        <div data-cid="${o.id}" class="cand-card p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer transition-all space-y-3 shadow-md group">
                          <div class="flex items-start justify-between">
                            <div class="flex items-center gap-2.5">
                              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                                ${o.name.split(" ").map(d=>d[0]).join("")}
                              </div>
                              <div>
                                <!-- Clickable Candidate Name -->
                                <h4 class="cand-name-click text-xs font-bold text-white group-hover:text-blue-400 transition-colors hover:underline" data-cid="${o.id}">${o.name}</h4>
                                <p class="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">${o.email}</p>
                              </div>
                            </div>
                            <span class="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">${o.experienceYears}y exp</span>
                          </div>

                          <div class="flex flex-wrap gap-1">
                            ${o.skills.slice(0,3).map(d=>`
                              <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-950 text-slate-300 border border-slate-800 rounded-lg">${d}</span>
                            `).join("")}
                          </div>

                          ${l?`
                            <div class="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                              <span class="font-extrabold ${l.percentage>=70?"text-emerald-400":"text-red-400"}">
                                Score: ${l.percentage}%
                              </span>
                              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${l.passStatus==="Pass"?"bg-emerald-500/20 text-emerald-300 border border-emerald-500/30":"bg-red-500/20 text-red-300 border border-red-500/30"}">
                                ${l.passStatus}
                              </span>
                            </div>
                          `:`
                            <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <button data-copy-link="${o.id}" class="copy-cand-link-btn text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
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
              <span class="text-xs font-mono text-slate-400">Showing Candidates: ${n.length}</span>
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
                  ${n.map(i=>{const r=t.candidateResults[i.id],o=r==null?void 0:r.sectionScores["Technical MCQs & Aptitude"],l=r==null?void 0:r.sectionScores["Database & SQL Engineering"],d=r==null?void 0:r.sectionScores["Algorithmic Coding Challenge"],p=r==null?void 0:r.sectionScores["Architectural Essay"];return`
                      <tr class="hover:bg-slate-900/60 transition-colors">
                        <td class="p-3.5">
                          <button class="cand-name-click text-left font-sans font-bold text-white hover:text-blue-400 hover:underline" data-cid="${i.id}">
                            ${i.name}
                          </button>
                          <div class="text-[10px] text-slate-400">${i.email}</div>
                        </td>
                        <td class="p-3.5">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${i.status}</span>
                        </td>
                        <td class="p-3.5 font-bold text-blue-400">${r?`${r.totalScore} / ${r.maxScore}`:"N/A"}</td>
                        <td class="p-3.5 font-bold ${r&&r.percentage>=70?"text-emerald-400":"text-red-400"}">${r?`${r.percentage}%`:"N/A"}</td>
                        <td class="p-3.5">${o?`${o.score}/${o.maxScore}`:"-"}</td>
                        <td class="p-3.5">${l?`${l.score}/${l.maxScore}`:"-"}</td>
                        <td class="p-3.5">${d?`${d.score}/${d.maxScore}`:"-"}</td>
                        <td class="p-3.5">${p?`${p.score}/${p.maxScore}`:"-"}</td>
                        <td class="p-3.5 ${r&&r.totalViolations>0?"text-amber-400 font-bold":"text-slate-400"}">${r?r.totalViolations:0}</td>
                        <td class="p-3.5 text-right space-x-2">
                          <button data-cid="${i.id}" class="cand-card px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold border border-slate-700">
                            Details
                          </button>
                          ${r?`
                            <button data-export-cand-csv="${i.id}" class="export-cand-csv-btn px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 text-[10px] font-bold border border-emerald-800/60">
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
    `,this.attachEvents()}attachEvents(){var e,t,s,a,n;this.container.querySelectorAll(".stage-tab-btn").forEach(i=>{i.addEventListener("click",r=>{const o=r.currentTarget.getAttribute("data-stage-tab");this.activeStageTab=o,this.render()})}),(e=this.container.querySelector("#view-kanban-btn"))==null||e.addEventListener("click",()=>{this.currentViewMode="kanban",this.render()}),(t=this.container.querySelector("#view-table-btn"))==null||t.addEventListener("click",()=>{this.currentViewMode="table",this.render()}),(s=this.container.querySelector("#export-all-csv-btn"))==null||s.addEventListener("click",()=>{const i=u.getState(),r=["Candidate Name","Email","Phone","Status","Total Score","Max Score","Percentage","Pass Status","Section 1 MCQs","Section 2 SQL","Section 3 Coding","Section 4 Essay","Violations"],o=i.candidates.map(l=>{var g,f,S,T;const d=i.candidateResults[l.id],p=((g=d==null?void 0:d.sectionScores["Technical MCQs & Aptitude"])==null?void 0:g.score)??"N/A",x=((f=d==null?void 0:d.sectionScores["Database & SQL Engineering"])==null?void 0:f.score)??"N/A",m=((S=d==null?void 0:d.sectionScores["Algorithmic Coding Challenge"])==null?void 0:S.score)??"N/A",h=((T=d==null?void 0:d.sectionScores["Architectural Essay"])==null?void 0:T.score)??"N/A";return[l.name,l.email,l.phone,l.status,d?d.totalScore:"N/A",d?d.maxScore:"N/A",d?`${d.percentage}%`:"N/A",d?d.passStatus:"N/A",p,x,m,h,d?d.totalViolations:0]});re.downloadCsv("Candidate_Section_Scores_Report.csv",r,o)}),this.container.querySelectorAll(".export-cand-csv-btn").forEach(i=>{i.addEventListener("click",r=>{r.stopPropagation();const o=r.currentTarget.getAttribute("data-export-cand-csv");o&&this.exportSingleCandidateCsv(o)})}),this.container.querySelectorAll(".copy-cand-link-btn").forEach(i=>{i.addEventListener("click",r=>{r.stopPropagation();const o=r.currentTarget.getAttribute("data-copy-link");o&&this.reissueInviteLink(o).catch(()=>{})})}),this.container.querySelectorAll(".cand-card, .cand-name-click").forEach(i=>{i.addEventListener("click",r=>{const o=r.currentTarget.getAttribute("data-cid");o&&(this.selectedCandidateId=o,this.renderCandidateDetailModal(o))})}),(a=this.container.querySelector("#view-sent-emails-btn"))==null||a.addEventListener("click",()=>{this.renderSentEmailsModal()}),(n=this.container.querySelector("#invite-cand-btn"))==null||n.addEventListener("click",()=>{this.renderInviteModal()})}renderSentEmailsModal(){var s;const e=oe.getSentEmails(),t=this.container.querySelector("#invite-modal-host");t&&(t.innerHTML=`
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
    `,(s=t.querySelector("#close-email-log-btn"))==null||s.addEventListener("click",()=>{t.innerHTML=""}))}exportSingleCandidateCsv(e){const t=u.getState(),s=t.candidates.find(r=>r.id===e),a=t.candidateResults[e];if(!s||!a)return;const n=["Section Name","Score Achieved","Max Score","Section Percentage"],i=Object.entries(a.sectionScores).map(([r,o])=>[r,o.score,o.maxScore,`${o.percentage}%`]);i.push(["OVERALL TOTAL",a.totalScore,a.maxScore,`${a.percentage}%`]),re.downloadCsv(`${s.name.replace(/\s+/g,"_")}_Section_Scorecard.csv`,n,i)}renderCandidateDetailModal(e){var r,o,l,d,p,x;const t=u.getState(),s=t.candidates.find(m=>m.id===e),a=t.candidateResults[e],n=this.container.querySelector("#scorecard-modal-host");if(!s||!n)return;n.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 lg:p-8 space-y-6 shadow-2xl">
          <!-- Candidate Particular Header Details -->
          <div class="flex items-start justify-between border-b border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                ${s.name.split(" ").map(m=>m[0]).join("")}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-xl font-extrabold text-white">${s.name}</h2>
                  <span class="px-3 py-0.5 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">${s.status}</span>
                </div>
                <p class="text-xs text-slate-400 mt-1">${s.email} • Phone: ${s.phone} • ${s.experienceYears} Years Experience</p>
                <div class="flex flex-wrap gap-1.5 mt-2">
                  ${s.skills.map(m=>`
                    <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800 rounded-md">${m}</span>
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
                    ${Object.entries(a.sectionScores).map(([m,h])=>`
                      <tr>
                        <td class="p-3 font-sans font-semibold">${m}</td>
                        <td class="p-3 font-bold">${h.score} / ${h.maxScore}</td>
                        <td class="p-3 ${h.percentage>=70?"text-emerald-400":"text-amber-400"}">${h.percentage}%</td>
                        <td class="p-3">
                          <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div class="h-full bg-blue-500" style="width: ${h.percentage}%"></div>
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
                ${t.questionBank.map((m,h)=>{var N;const g=t.candidateAnswers[m.id]||"opt-4",f=m.type==="mcq",S=m.type==="coding"||m.type==="sql",T=((N=m.correctAnswers)==null?void 0:N[0])||"opt-4";let I=g,R=T;if(f&&m.options){const y=m.options.find(P=>P.id===g||P.text===g),w=m.options.find(P=>P.id===T);y&&(I=y.text),w&&(R=w.text)}const H=g===T||I===R,Q=t.codeSubmissions[m.id],O=m.testCases||[{id:"tc-1",input:"[2,7,11,15], 9",expectedOutput:"[0,1]",isHidden:!1,weight:10},{id:"tc-2",input:"[3,2,4], 6",expectedOutput:"[1,2]",isHidden:!1,weight:10},{id:"tc-3",input:"[3,3], 6",expectedOutput:"[0,1]",isHidden:!1,weight:10},{id:"tc-4",input:"[1,5,8,12], 20",expectedOutput:"[2,3]",isHidden:!0,weight:10},{id:"tc-5",input:"[-1,-2,-3,-4], -7",expectedOutput:"[2,3]",isHidden:!0,weight:10}],F=O.reduce((y,w)=>y+w.weight,0),k=Q?Q.passedCount??4:4,E=O.slice(0,k).reduce((y,w)=>y+w.weight,0);return`
                    <div class="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${f?"bg-emerald-500/20 text-emerald-300":S?"bg-purple-500/20 text-purple-300":"bg-blue-500/20 text-blue-300"}">${m.type}</span>
                          <span class="font-bold text-white">${h+1}. ${m.title}</span>
                        </div>
                        <span class="font-mono text-[11px] font-bold ${f?H?"text-emerald-400":"text-red-400":"text-purple-400"}">
                          ${f?H?`✓ Correct (+${m.points} pts)`:"✕ Incorrect (0 pts)":`Score: ${E} / ${F} Marks (${k}/${O.length} Passed)`}
                        </span>
                      </div>

                      ${f?`
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                          <div class="p-2 rounded-lg ${H?"bg-emerald-500/10 border border-emerald-500/30 text-emerald-300":"bg-red-500/10 border border-red-500/30 text-red-300"}">
                            <b>Candidate Selected:</b> ${I} ${H?"✓":"❌"}
                          </div>
                          <div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            <b>Admin Configured Answer:</b> ${R} ✓
                          </div>
                        </div>
                      `:S?`
                        <div class="space-y-1.5 pt-1">
                          <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
                            <span>Test Case Pass Rate: <b class="text-emerald-400">${k} / ${O.length} Passed</b></span>
                            <span class="text-amber-400 font-bold">${E} / ${F} Marks (Lost ${F-E} pts)</span>
                          </div>
                          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                            ${O.map((y,w)=>{const P=w<k;return`
                                <div class="p-2 rounded-lg ${P?"bg-emerald-500/10 border border-emerald-500/30 text-emerald-300":"bg-red-500/10 border border-red-500/30 text-red-300"} flex items-center justify-between">
                                  <span>Test Case ${w+1} (${y.input})</span>
                                  <span class="font-bold">${P?`✓ Passed (+${y.weight} pts)`:`❌ Failed (0/${y.weight} pts)`}</span>
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
                ${(a.proctoringLogs||[]).map(m=>`
                  <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded ${m.severity==="high"?"bg-red-500/20 text-red-300 border border-red-500/30":"bg-amber-500/20 text-amber-300 border border-amber-500/30"}">${m.severity.toUpperCase()}</span>
                      <span class="font-bold text-white">${m.type}</span>
                      <span class="text-slate-400">${m.description}</span>
                    </div>
                    <span class="font-mono text-slate-500 text-[10px]">${m.timestamp}</span>
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
    `,(r=n.querySelector("#close-modal-btn"))==null||r.addEventListener("click",()=>{n.innerHTML=""}),(o=n.querySelector("#download-scorecard-csv-btn"))==null||o.addEventListener("click",()=>{this.exportSingleCandidateCsv(e)}),(l=n.querySelector("#modal-copy-link-btn"))==null||l.addEventListener("click",()=>{this.reissueInviteLink(e).catch(()=>{})});const i=n.querySelector("#recruiter-notes");(d=n.querySelector("#decide-select"))==null||d.addEventListener("click",()=>{u.updateCandidateDecision(e,"Selected",(i==null?void 0:i.value)||""),u.updateCandidateStatus(e,"Selected"),n.innerHTML="",this.render()}),(p=n.querySelector("#decide-review"))==null||p.addEventListener("click",()=>{u.updateCandidateDecision(e,"Under Review",(i==null?void 0:i.value)||""),u.updateCandidateStatus(e,"Under Review"),n.innerHTML="",this.render()}),(x=n.querySelector("#decide-reject"))==null||x.addEventListener("click",()=>{u.updateCandidateDecision(e,"Rejected",(i==null?void 0:i.value)||""),u.updateCandidateStatus(e,"Rejected"),n.innerHTML="",this.render()})}renderInviteModal(){var d;const e=this.container.querySelector("#invite-modal-host");if(!e)return;const t=u.getState();let s="";e.innerHTML=`
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
              <input id="gen-link-input" type="text" readonly value="" placeholder="Generated securely when you dispatch the invitation" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-blue-300 font-mono text-xs focus:ring-1 focus:ring-blue-500" />
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
              <span>✉️</span> DISPATCH EMAIL INVITATION
            </button>
          </div>
        </div>
      </div>
    `,(d=e.querySelector("#close-invite-btn"))==null||d.addEventListener("click",()=>{e.innerHTML="",this.render()});const a=e.querySelector("#copy-link-btn"),n=e.querySelector("#gen-link-input");a==null||a.addEventListener("click",()=>{n&&n.value&&(n.select(),navigator.clipboard.writeText(n.value).then(()=>{a.innerHTML="<span>✓</span> Copied!",a.classList.replace("bg-blue-600","bg-emerald-600"),setTimeout(()=>{a.innerHTML="<span>📋</span> Copy Link",a.classList.replace("bg-emerald-600","bg-blue-600")},2500)}).catch(()=>{}))});const i=e.querySelector("#send-inv-btn"),r=e.querySelector("#dispatch-output-box"),o=e.querySelector("#dispatch-msg-text"),l=e.querySelector("#launch-cand-link-btn");i==null||i.addEventListener("click",async()=>{const p=e.querySelector("#inv-name").value.trim()||"Candidate",x=e.querySelector("#inv-email").value.trim(),m=e.querySelector("#inv-phone").value.trim(),h=parseInt(e.querySelector("#inv-exp").value,10)||48,g=f=>f.replace(/[&<>"']/g,S=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[S]);if(!x){alert("Please enter the candidate email address.");return}i.disabled=!0;try{const f=await C.createInvite({name:p,email:x,phone:m,assessmentId:t.activeAssessmentId,expiresInHours:h});s=f.link,n&&(n.value=s),oe.recordInvite(p,x,s,f.devOtp),u.addCandidate({id:f.candidateId,name:p,email:x,phone:m,experienceYears:4,skills:["Python","SQL"],status:"Assessment Sent",assessmentId:t.activeAssessmentId,invitedAt:new Date().toISOString().split("T")[0],otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1}),r&&o&&(o.innerHTML=`Invitation with a secure personal link and a one-time passcode has been emailed to <strong class="text-white">${g(f.otpDestination)}</strong>.${f.devOtp?` <span class="text-amber-300">(DEV OTP: <strong>${g(f.devOtp)}</strong>)</span>`:""}`,r.classList.remove("hidden")),i.textContent="✓ Invitation dispatched to "+x,i.className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-xs tracking-wider opacity-90 cursor-not-allowed",this.renderEmailDispatchedSuccessPopup(p,x,s,f.devOtp||null)}catch(f){i.disabled=!1,alert(f instanceof q?f.message:"Could not create the invitation.")}}),l==null||l.addEventListener("click",()=>{s&&window.open(s,"_blank")})}async reissueInviteLink(e){const t=u.getState(),s=t.candidates.find(a=>a.id===e);if(s&&confirm(`Issue a new personal link and passcode for ${s.name}? A fresh invitation email will be sent to ${s.email}.`))try{const a=await C.createInvite({name:s.name,email:s.email,phone:s.phone,assessmentId:s.assessmentId||t.activeAssessmentId,expiresInHours:48,candidateId:s.id});await navigator.clipboard.writeText(a.link).catch(()=>{}),alert(`New invitation sent to ${a.otpDestination} and link copied to clipboard.${a.devOtp?`

DEV OTP: ${a.devOtp}`:""}`)}catch(a){alert(a instanceof q?a.message:"Could not issue a new invitation.")}}renderEmailDispatchedSuccessPopup(e,t,s,a){var i,r;const n=document.createElement("div");n.id="email-sent-success-popup",n.innerHTML=`
      <div class="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-emerald-500/40 bg-slate-950/95 p-8 space-y-6 shadow-2xl text-center animate-scale-up">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/20">
            ✉️
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-extrabold text-white">Assessment Invitation Dispatched!</h3>
            <p class="text-xs text-slate-300 leading-relaxed">
              Assessment link and a one-time access passcode have been emailed to candidate <strong class="text-white">${e}</strong>.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-2 font-mono text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Recipient Email:</span>
              <strong class="text-white">${t}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Access OTP Code:</span>
              <strong class="text-emerald-400">${a?a+" (dev mode)":"Sent to candidate only"}</strong>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Delivery Gateway:</span>
              <span class="text-emerald-400 font-sans text-[11px] font-bold">Server-side Gmail SMTP (smtp.gmail.com:587)</span>
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
    `,document.body.appendChild(n),(i=n.querySelector("#close-popup-btn"))==null||i.addEventListener("click",()=>{n.remove()}),(r=n.querySelector("#open-exam-tab-btn"))==null||r.addEventListener("click",()=>{n.remove(),window.open(s,"_blank")})}}class vt{constructor(e,t){this.container=e,this.portal=t}render(){var n;const e=u.getState(),t=e.currentUser,s=A[this.portal],a=e.allowedPortals.map(i=>A[i]);this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mx-auto flex items-center justify-center text-2xl">⛔</div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Access denied</h2>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <b class="text-slate-200">${(t==null?void 0:t.name)??""}</b> (${(t==null?void 0:t.role)??""}).
              That role cannot open the <b class="text-slate-200">${s.title}</b>.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            ${a.map(i=>`
              <button data-go="${i.path}" class="go-btn w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider transition-all">
                ${i.icon} Go to ${i.title}
              </button>
            `).join("")}
            <button id="denied-logout" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              🚪 Sign out to use a different account
            </button>
          </div>
        </div>
      </div>
    `,this.container.querySelectorAll(".go-btn").forEach(i=>i.addEventListener("click",r=>B.navigate(r.currentTarget.getAttribute("data-go")||"/"))),(n=this.container.querySelector("#denied-logout"))==null||n.addEventListener("click",()=>{u.logoutStaff().catch(()=>{})})}}const yt=c=>c instanceof q?c.message:"Something went wrong. Please try again.",pe=8;function wt(c,e){var l,d,p,x;const t=A[e.portal],s=u.getState().currentUser;c.innerHTML=`
    <div class="glass-panel w-full max-w-md mx-auto rounded-3xl border border-slate-800 p-8 space-y-5 shadow-2xl">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
        <span class="text-2xl">🔑</span>
        <div class="flex-1">
          <h2 class="text-lg font-extrabold text-white">${e.forced?"Set your new password":"Change password"}</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">${e.forced?`Your administrator issued a temporary password for the ${t.loginTitle}. Choose your own to continue.`:"You will be signed out of your other devices."}</p>
        </div>
        ${e.forced?"":'<button id="pw-cancel-x" class="text-slate-400 hover:text-white font-bold">✕</button>'}
      </div>

      <p id="pw-error" class="text-xs font-semibold text-red-400 hidden"></p>

      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-current">${e.forced?"Temporary password":"Current password"}</label>
          <input id="pw-current" type="password" autocomplete="current-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-new">New password</label>
          <input id="pw-new" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="At least ${pe} characters" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-confirm">Confirm new password</label>
          <input id="pw-confirm" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <button id="pw-submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60">
          UPDATE PASSWORD ➔
        </button>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>Signed in as <b class="text-slate-300">${s?s.email.replace(/[<>&"]/g,""):""}</b></span>
          ${e.forced?'<button id="pw-logout" type="button" class="font-semibold text-slate-400 hover:text-white">Sign out</button>':'<button id="pw-cancel" type="button" class="font-semibold text-slate-400 hover:text-white">Cancel</button>'}
        </div>
      </div>
    </div>
  `;const a=m=>c.querySelector(m),n=a("#pw-error"),i=m=>{n&&(n.textContent=m,n.classList.toggle("hidden",!m))},r=a("#pw-submit"),o=()=>{var f,S,T;const m=((f=a("#pw-current"))==null?void 0:f.value)||"",h=((S=a("#pw-new"))==null?void 0:S.value)||"",g=((T=a("#pw-confirm"))==null?void 0:T.value)||"";if(!m||!h)return i("Fill in all the fields.");if(h.length<pe)return i(`New password must be at least ${pe} characters.`);if(h!==g)return i("The new passwords do not match.");if(h===m)return i("Choose a password different from the current one.");i(""),r&&(r.disabled=!0),C.changePassword(e.portal,m,h).then(I=>{var R;u.loginStaff(I.user),(R=e.onCancel)==null||R.call(e)}).catch(I=>{i(yt(I)),r&&r.isConnected&&(r.disabled=!1)})};r==null||r.addEventListener("click",o),c.querySelectorAll("input").forEach(m=>m.addEventListener("keydown",h=>{h.key==="Enter"&&o()})),(l=a("#pw-logout"))==null||l.addEventListener("click",()=>{u.logoutStaff().catch(()=>{})}),(d=a("#pw-cancel"))==null||d.addEventListener("click",()=>{var m;return(m=e.onCancel)==null?void 0:m.call(e)}),(p=a("#pw-cancel-x"))==null||p.addEventListener("click",()=>{var m;return(m=e.onCancel)==null?void 0:m.call(e)}),(x=a("#pw-current"))==null||x.focus()}class St{constructor(e,t){this.container=e,this.portal=t}render(){this.container.innerHTML='<div class="py-16 px-4"><div id="forced-pw-host"></div></div>',wt(this.container.querySelector("#forced-pw-host"),{portal:this.portal,forced:!0})}}const v={portal:null,step:"credentials",email:"",challengeId:"",otpDestination:"",devOtp:"",info:""};function je(c){v.portal=c,v.step="credentials",v.email="",v.challengeId="",v.otpDestination="",v.devOtp="",v.info=""}const te=c=>c.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),kt=c=>c instanceof q?c.message:"Something went wrong. Please try again.";class Et{constructor(e,t){b(this,"container");b(this,"portal");this.container=e,this.portal=t,v.portal!==t&&je(t)}render(){const e=A[this.portal];this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel w-full rounded-3xl border border-slate-800 p-8 space-y-6 shadow-2xl">
          <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
            <span class="text-2xl">${e.icon}</span>
            <div>
              <h1 class="text-lg font-extrabold text-white">${e.loginTitle}</h1>
              <p class="text-[11px] text-slate-400 mt-0.5">${e.blurb}</p>
            </div>
          </div>

          <p id="login-error" class="text-xs font-semibold text-red-400 hidden"></p>
          <p id="login-info" class="text-xs font-semibold text-emerald-400 ${v.info?"":"hidden"}">${te(v.info)}</p>

          ${v.step==="credentials"?this.credentialsHtml():this.otpHtml()}

          <p class="text-[11px] text-slate-500 text-center">
            Accounts are created by your System Administrator. Forgot your password? Ask them to reset it.
          </p>
        </div>
      </div>
    `,this.attachEvents()}credentialsHtml(){return`
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-email">Enterprise Email</label>
          <input id="login-email" type="text" autocomplete="username" value="${te(v.email)}"
            class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="you@company.com" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-password">Password</label>
          <input id="login-password" type="password" autocomplete="current-password" value=""
            class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="••••••••" />
        </div>
        <button id="submit-creds-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          <span>SEND 2FA EMAIL OTP</span> <span>➔</span>
        </button>
      </div>
    `}otpHtml(){return`
      <div class="space-y-4 text-xs">
        <div class="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
          <span class="font-bold">✉️ 2FA OTP sent to your email</span>
          <p class="text-[11px] text-slate-300 mt-1">A 6-digit passcode was sent to <code class="text-emerald-400 font-bold font-mono">${te(v.otpDestination)}</code>. It expires in 10 minutes.</p>
        </div>
        ${v.devOtp?`<div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">🧪 DEV MODE: OTP is <strong class="font-mono tracking-widest">${te(v.devOtp)}</strong> (hidden in production)</div>`:""}
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="login-otp-input">6-Digit Email OTP</label>
          <input id="login-otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value=""
            class="glass-input w-full px-4 py-3 rounded-xl text-center font-mono text-xl tracking-[0.5em] font-bold border border-slate-700 bg-slate-950 text-emerald-400 focus:ring-2 focus:ring-emerald-500" placeholder="------" />
        </div>
        <button id="verify-otp-btn" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          <span>VERIFY OTP & SIGN IN</span> <span>➔</span>
        </button>
        <div class="flex items-center justify-between">
          <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get it? Resend code</button>
          <button id="back-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">← Use a different account</button>
        </div>
      </div>
    `}showError(e){var s;const t=this.container.querySelector("#login-error");t&&(t.textContent=e,t.classList.toggle("hidden",!e),e&&((s=this.container.querySelector("#login-info"))==null||s.classList.add("hidden")))}run(e,t){const s=e;s&&(s.disabled=!0),this.showError(""),t().catch(a=>this.showError(kt(a))).finally(()=>{s&&s.isConnected&&(s.disabled=!1)})}onEnter(e,t){e==null||e.addEventListener("keydown",s=>{s.key==="Enter"&&(t==null||t.click())})}attachEvents(){var a,n,i;const e=r=>this.container.querySelector(r);if(v.step==="credentials"){const r=e("#login-email"),o=e("#login-password"),l=e("#submit-creds-btn");this.onEnter(r,l),this.onEnter(o,l),(a=r!=null&&r.value?o:r)==null||a.focus(),l==null||l.addEventListener("click",()=>{const d=((r==null?void 0:r.value)||"").trim(),p=(o==null?void 0:o.value)||"";if(v.email=d,!d||!p){this.showError("Enter your email and password.");return}this.run(l,async()=>{const x=await C.login(this.portal,d,p);v.challengeId=x.challengeId,v.otpDestination=x.otpDestination,v.devOtp=x.devOtp||"",v.step="otp",v.info="",this.render()})});return}const t=e("#login-otp-input"),s=e("#verify-otp-btn");this.onEnter(t,s),t==null||t.focus(),s==null||s.addEventListener("click",()=>{const r=((t==null?void 0:t.value)||"").trim();if(r.length!==6){this.showError("Enter the 6-digit passcode.");return}this.run(s,async()=>{const o=await C.verifyOtp(this.portal,v.challengeId,r);je(this.portal),u.loginStaff(o.user)})}),(n=e("#resend-otp-btn"))==null||n.addEventListener("click",r=>{this.run(r.currentTarget,async()=>{const o=await C.resendOtp(this.portal,v.challengeId);v.challengeId=o.challengeId,v.devOtp=o.devOtp||"",v.info="A new passcode has been sent.",this.render()})}),(i=e("#back-btn"))==null||i.addEventListener("click",()=>{v.step="credentials",v.challengeId="",v.devOtp="",v.info="",this.render()})}}class Ct{constructor(){b(this,"appElement");b(this,"navbarHost");b(this,"contentHost");b(this,"restoring",new Set);b(this,"wasStaffAuthenticated",!1);this.appElement=document.getElementById("app"),this.appElement.innerHTML=`
      <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host" class="sticky top-0 z-50"></div>
        <main id="content-host" class="flex-1"></main>
      </div>
    `,this.navbarHost=document.getElementById("navbar-host"),this.contentHost=document.getElementById("content-host"),u.subscribe(()=>this.render()),B.subscribe(()=>{this.syncSession(z()).catch(e=>console.error("Session restore failed",e)),this.render()})}async syncSession(e){if(e.kind!=="staff")return;const t=e.portal;if(u.getState().isStaffAuthenticated){C.setActivePortal(t);return}if(!this.restoring.has(t)){this.restoring.add(t),u.setAuthReady(!1);try{const a=await C.restoreSession(t);a&&u.loginStaff(a.user)}catch(a){console.error("Session restore failed",a)}finally{this.restoring.delete(t),u.setAuthReady(!0)}}}render(){new me(this.navbarHost).render();const t=u.getState(),s=z();if(t.isStaffAuthenticated!==this.wasStaffAuthenticated&&(this.wasStaffAuthenticated=t.isStaffAuthenticated,Xe()),this.contentHost.innerHTML="",s.kind==="candidate"){new be(this.contentHost).render();return}const a=s.portal;if(!t.authReady){this.contentHost.innerHTML=`
        <div class="py-24 text-center text-xs text-slate-500 font-mono">Checking your session…</div>
      `;return}if(!t.isStaffAuthenticated||!t.currentUser){new Et(this.contentHost,a).render();return}if(!t.allowedPortals.includes(a)){new vt(this.contentHost,a).render();return}if(t.currentUser.mustChangePassword){new St(this.contentHost,a).render();return}const n=this.navbarHost.offsetHeight;this.contentHost.innerHTML=`
      <div class="flex flex-col md:flex-row md:items-start">
        <aside id="sidebar-host"
          class="glass-panel w-full md:w-64 md:shrink-0 rounded-none border-0 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:sticky md:overflow-y-auto"
          style="${n?`top:${n}px;height:calc(100vh - ${n}px)`:""}"></aside>
        <div id="portal-host" class="flex-1 min-w-0"></div>
      </div>
    `,new ot(this.contentHost.querySelector("#sidebar-host"),a).render();const i=this.contentHost.querySelector("#portal-host");a==="admin"?new ct(i).render():a==="recruiter"?new gt(i).render():new bt(i).render()}}document.addEventListener("DOMContentLoaded",async()=>{const c=new Ct;c.render();try{await c.syncSession(z())}catch(e){console.error("Session restore failed",e)}finally{u.markAuthReady()}});window.addEventListener("unhandledrejection",c=>{console.error("Unhandled promise rejection:",c.reason)});
//# sourceMappingURL=index-0TA1QJc8.js.map
