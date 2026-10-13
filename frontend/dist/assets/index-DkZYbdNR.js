var Lu=Object.defineProperty;var Iu=(t,e,s)=>e in t?Lu(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var b=(t,e,s)=>Iu(t,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function s(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(n){if(n.ep)return;n.ep=!0;const i=s(n);fetch(n.href,i)}})();const zn={};var od;const rd=((od=zn==null?void 0:zn.VITE_API_URL)==null?void 0:od.replace(/\/$/,""))||"http://localhost:8000",da=`${rd}/api/v1`;class V extends Error{constructor(s,a){super(a);b(this,"status");this.status=s}}const wi="confered.candidateToken";let Me=null,Is=(()=>{try{return sessionStorage.getItem(wi)}catch{return null}})();function hr(t){Is=t;try{t?sessionStorage.setItem(wi,t):sessionStorage.removeItem(wi)}catch{}}let Ts="recruiter",_a=null,za=null;function Si(t,e){var a;const s=t==null?void 0:t.detail;return typeof s=="string"?s:Array.isArray(s)&&((a=s[0])!=null&&a.msg)?String(s[0].msg):`Request failed (${e})`}async function on(t,e,s,a,n=0){const i={};s!==void 0&&(i["Content-Type"]="application/json");const o=a==="staff"?Me:a==="candidate"?Is:null;o&&(i.Authorization=`Bearer ${o}`);const r=n>0?new AbortController:null,l=r?window.setTimeout(()=>r.abort(),n):0;try{return await fetch(`${da}${t}`,{method:e,headers:i,credentials:"include",body:s!==void 0?JSON.stringify(s):void 0,signal:r==null?void 0:r.signal})}catch(d){const c=d instanceof DOMException&&d.name==="AbortError";throw new V(0,c?"The server took too long to answer. Wait a moment and try again.":"Cannot reach the server. Make sure the backend is running.")}finally{l&&window.clearTimeout(l)}}async function ld(t,e,s,a,n=0){let i=await on(t,e,s,a,n);return i.status===401&&a==="staff"&&Me&&(await ki(Ts)?i=await on(t,e,s,a,n):dd()),i}async function kt(t,e="GET",s,a="none",n=2e4){const i=await ld(t,e,s,a,n),o=await i.json().catch(()=>null);if(!i.ok)throw new V(i.status,Si(o,i.status));return o}function dd(){Me=null,za==null||za()}async function ki(t){return _a||(_a=(async()=>{try{const e=await on(`/${t}/auth/refresh`,"POST",void 0,"none",8e3);if(!e.ok)return null;const s=await e.json();return Me=s.accessToken,s}catch{return null}finally{setTimeout(()=>_a=null,0)}})()),_a}const L={apiBase:rd,setSessionExpiredHandler(t){za=t},getStaffToken:()=>Me,getCandidateToken:()=>Is,login:(t,e,s)=>kt(`/${t}/auth/login`,"POST",{email:e,password:s}),async verifyOtp(t,e,s){const a=await kt(`/${t}/auth/verify-otp`,"POST",{challengeId:e,otp:s});return Me=a.accessToken,Ts=t,a},resendOtp:(t,e)=>kt(`/${t}/auth/resend-otp`,"POST",{challengeId:e}),async restoreSession(t){return Ts=t,ki(t)},setActivePortal(t){Ts=t},async changePassword(t,e,s){const a=await kt(`/${t}/auth/change-password`,"POST",{currentPassword:e,newPassword:s},"staff");return Me=a.accessToken,a},async logout(){try{await on(`/${Ts}/auth/logout`,"POST",void 0,"none")}catch{}finally{Me=null}},createInvite:t=>kt("/recruiter/candidates/invites","POST",t,"staff"),inviteDelivery:t=>kt(`/recruiter/candidates/invites/${encodeURIComponent(t)}/delivery`,"GET",void 0,"staff"),async candidateVerify(t,e){const s=await kt("/candidate/verify","POST",{inviteToken:t,otp:e});return hr(s.accessToken),s},candidateResendOtp:t=>kt("/candidate/resend-otp","POST",{inviteToken:t}),clearCandidateSession(){hr(null)},postKeepalive(t,e,s="candidate"){const a=s==="staff"?Me:s==="candidate"?Is:null,n={"Content-Type":"application/json"};a&&(n.Authorization=`Bearer ${a}`);try{fetch(`${da}${t}`,{method:"POST",headers:n,credentials:"include",body:JSON.stringify(e),keepalive:!0})}catch{}},flushJson(t,e,s="candidate"){const a=s==="staff"?Me:s==="candidate"?Is:null,n={"Content-Type":"application/json"};a&&(n.Authorization=`Bearer ${a}`);try{fetch(`${da}${t}`,{method:"PUT",headers:n,credentials:"include",body:JSON.stringify(e),keepalive:!0})}catch{}},async downloadFile(t){const e=await ld(t,"GET",void 0,"staff");if(!e.ok){const n=await e.json().catch(()=>null);throw new V(e.status,Si(n,e.status))}const s=e.headers.get("Content-Disposition")||"",a=/filename="?([^";]+)"?/i.exec(s);return{blob:await e.blob(),filename:a?a[1]:"download.csv",truncated:e.headers.get("X-Export-Truncated")==="true"}},fetchJson:(t,e="GET",s,a="staff")=>kt(t,e,s,a),async uploadForm(t,e,s="staff"){const a={},n=s==="staff"?Me:s==="candidate"?Is:null;n&&(a.Authorization=`Bearer ${n}`);let i=await fetch(`${da}${t}`,{method:"POST",headers:a,credentials:"include",body:e});if(i.status===401&&s==="staff"&&Me)if(await ki(Ts)){const r={};Me&&(r.Authorization=`Bearer ${Me}`),i=await fetch(`${da}${t}`,{method:"POST",headers:r,credentials:"include",body:e})}else dd();if(!i.ok){const o=await i.json().catch(()=>null);throw new V(i.status,Si(o,i.status))}if(i.status!==204)return i.json()}};class Mu{static executeCode(e,s,a){return L.fetchJson("/candidate/run","POST",{questionId:a,language:e,code:s},"candidate")}}const _u="modulepreload",ju=function(t){return"/"+t},fr={},$i=function(e,s,a){let n=Promise.resolve();if(s&&s.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),r=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));n=Promise.allSettled(s.map(l=>{if(l=ju(l),l in fr)return;fr[l]=!0;const d=l.endsWith(".css"),c=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${c}`))return;const u=document.createElement("link");if(u.rel=d?"stylesheet":_u,d||(u.as="script"),u.crossOrigin="",u.href=l,r&&u.setAttribute("nonce",r),document.head.appendChild(u),d)return new Promise((h,p)=>{u.addEventListener("load",h),u.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(o){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=o,window.dispatchEvent(r),!r.defaultPrevented)throw o}return n.then(o=>{for(const r of o||[])r.status==="rejected"&&i(r.reason);return e().catch(i)})},Pu={maxTabSwitches:3,maxViolationsBeforeTerminate:5,proctoringSensitivity:"high",requireCamera:!0,requireMicrophone:!0,requireScreenShare:!1,detectPhone:!0,detectMultipleFaces:!0,detectFaceMissing:!0,enableFullscreenLock:!0,otpMethod:"both",linkExpirationHours:48,allowSectionRevisit:!1},ca=[{id:"q-mcq-1",type:"mcq",title:"Python Memory Management",content:"Which module in Python can be used to inspect memory allocation and reference counts?",options:[{id:"opt-1",text:"sys"},{id:"opt-2",text:"gc"},{id:"opt-3",text:"tracemalloc"},{id:"opt-4",text:"All of the above"}],correctAnswers:["opt-4"],difficulty:"medium",points:10,category:"Python",tags:["Core Python","Memory","Performance"]},{id:"q-sql-1",type:"sql",title:"Employee Department Salary Ranking",content:"Write an SQL query to retrieve the top 2 highest paid employees in each department using Window Functions.",difficulty:"hard",points:20,category:"SQL Database",tags:["PostgreSQL","Window Functions","Analytics"],sampleCode:{sql:`-- Write your SQL query below
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
console.log(maxProduct([2,3,-2,4]));`},testCases:[{id:"tc-1",input:"[2,3,-2,4]",expectedOutput:"6",isHidden:!1,weight:5},{id:"tc-2",input:"[-2,0,-1]",expectedOutput:"0",isHidden:!1,weight:5},{id:"tc-3",input:"[-2,3,-4]",expectedOutput:"24",isHidden:!0,weight:10},{id:"tc-4",input:"[0, 2]",expectedOutput:"2",isHidden:!0,weight:5}]},{id:"q-essay-1",type:"essay",title:"Microservice Architecture vs Monolith Design",content:"Discuss the architectural trade-offs between a modular monolithic system and an event-driven microservices architecture. Highlight aspects of deployment complexity, data consistency (CAP theorem / Saga pattern), and operational costs.",essayMinWords:150,essayMaxWords:500,difficulty:"hard",points:20,category:"System Design",tags:["Architecture","Microservices","Distributed Systems"]}],Kn=[{id:"assess-101",title:"Senior Full Stack & AI Engineer Assessment",roleTitle:"Senior Software Engineer",description:"Comprehensive technical evaluation covering Quantitative Logic, Python/JS Algorithmic Coding, SQL Querying, and System Design Architecture.",totalDurationMinutes:60,totalQuestions:4,passingPercentage:70,status:"active",createdDate:"2026-07-20",sections:[{id:"sec-1",name:"Technical MCQs & Aptitude",description:"Core concepts in Python memory, async logic, and data structures.",instructions:"Select the best answer for each question. Negative marking is disabled for this section.",timeLimitMinutes:10,passingMarks:10,questions:[ca[0]],isMandatory:!0},{id:"sec-2",name:"Database & SQL Engineering",description:"Complex aggregation, window functions, and schema optimization.",instructions:"Write production-ready SQL queries. Test against the provided table schemas.",timeLimitMinutes:15,passingMarks:15,questions:[ca[1]],isMandatory:!0},{id:"sec-3",name:"Algorithmic Coding Challenge",description:"Data Structures and Dynamic Programming problem solving.",instructions:"Write efficient code. Pay attention to time complexity and edge cases.",timeLimitMinutes:20,passingMarks:20,questions:[ca[2]],isMandatory:!0},{id:"sec-4",name:"Architectural Essay",description:"System design principles, microservices, and high-availability systems.",instructions:"Ensure minimum word count requirement of 150 words.",timeLimitMinutes:15,passingMarks:15,questions:[ca[3]],isMandatory:!1}]}],ja="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%231e293b' stroke='%233b82f6' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><circle cx='12' cy='9' r='4'/><path d='M5 20v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1'/></svg>",Pa="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 24 24' fill='%230f172a' stroke='%23a855f7' stroke-width='1.5'><rect width='24' height='24' rx='3' fill='%230f172a'/><rect x='3' y='4' width='18' height='16' rx='2' fill='%231e293b'/><circle cx='8' cy='11' r='2.5'/><path d='M14 9h4m-4 4h4m-8 3h8'/></svg>",Du=[{id:"cand-1",name:"Alex Rivera",email:"alex.rivera@example.com",phone:"+1-555-0192",experienceYears:6,skills:["Python","FastAPI","TypeScript","PostgreSQL","Docker"],status:"Completed",assessmentId:"assess-101",invitedAt:"2026-07-28",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:ja,idProofUrl:Pa,identityStatus:"approved"},{id:"cand-2",name:"Priya Sharma",email:"priya.sharma@example.com",phone:"+91-98765-43210",experienceYears:8,skills:["Java","Spring Boot","Microservices","SQL","Kubernetes"],status:"Under Review",assessmentId:"assess-101",invitedAt:"2026-07-29",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:ja,idProofUrl:Pa,identityStatus:"approved"},{id:"cand-3",name:"Marcus Vance",email:"marcus.vance@example.com",phone:"+44-7700-900077",experienceYears:4,skills:["React","Node.js","GraphQL","Tailwind","MongoDB"],status:"Assessment Sent",assessmentId:"assess-101",invitedAt:"2026-07-30",otpVerified:!1,systemCheckPassed:!1,assessmentCompleted:!1,livePhotoUrl:ja,idProofUrl:Pa,identityStatus:"pending_verification"},{id:"cand-4",name:"Sophia Chen",email:"sophia.chen@example.com",phone:"+1-555-0144",experienceYears:5,skills:["Python","PyTorch","FastAPI","Docker","AWS"],status:"Selected",assessmentId:"assess-101",invitedAt:"2026-07-25",otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!0,livePhotoUrl:ja,idProofUrl:Pa,identityStatus:"approved"}],qu=[{candidateId:"cand-3",name:"Marcus Vance",role:"Frontend Engineer",sectionName:"Algorithmic Coding Challenge",timeRemaining:"18:42",violations:0,status:"normal",lastEvent:""},{candidateId:"cand-2",name:"Priya Sharma",role:"Backend Engineer",sectionName:"Database & SQL Engineering",timeRemaining:"09:15",violations:2,status:"warning",lastEvent:"Tab Switch detected"},{candidateId:"cand-1",name:"Alex Rivera",role:"Platform Engineer",sectionName:"Technical MCQs & Aptitude",timeRemaining:"24:03",violations:0,status:"normal",lastEvent:""}],Ru={"cand-1":{id:"res-1",candidateId:"cand-1",assessmentId:"assess-101",completedAt:"2026-07-28T16:45:00Z",totalScore:68,maxScore:75,percentage:90.6,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:20,maxScore:20,percentage:100},"Algorithmic Coding Challenge":{score:25,maxScore:25,percentage:100},"Architectural Essay":{score:13,maxScore:20,percentage:65}},aiConfidenceScore:94.5,totalViolations:1,proctoringLogs:[{id:"viol-1",candidateId:"cand-1",timestamp:"16:12:04",type:"Tab Switch",severity:"low",description:"Candidate switched window for 2 seconds (Warning issued)"}],recruiterNotes:"Exceptional coding speed and SQL window function expertise. Essay demonstrates solid understanding of Saga pattern trade-offs.",recruiterDecision:"Selected"},"cand-2":{id:"res-2",candidateId:"cand-2",assessmentId:"assess-101",completedAt:"2026-07-29T11:20:00Z",totalScore:54,maxScore:75,percentage:72,passStatus:"Pass",sectionScores:{"Technical MCQs & Aptitude":{score:10,maxScore:10,percentage:100},"Database & SQL Engineering":{score:15,maxScore:20,percentage:75},"Algorithmic Coding Challenge":{score:15,maxScore:25,percentage:60},"Architectural Essay":{score:14,maxScore:20,percentage:70}},aiConfidenceScore:88,totalViolations:2,proctoringLogs:[{id:"viol-2",candidateId:"cand-2",timestamp:"11:05:12",type:"Looking Away",severity:"low",description:"Gaze moved off-screen for 4 seconds."},{id:"viol-3",candidateId:"cand-2",timestamp:"11:15:40",type:"Background Voice",severity:"medium",description:"Background audio detected above threshold."}],recruiterNotes:"Passed baseline cutoff. Requires technical interview follow-up on algorithmic edge cases.",recruiterDecision:"Under Review"}},cd="confered.examSnapshot";function Ou(t){try{sessionStorage.setItem(cd,JSON.stringify(t))}catch{}}function Fu(){try{const t=sessionStorage.getItem(cd);if(!t)return null;const e=JSON.parse(t);return!e||typeof e!="object"||!e.inviteToken?null:e}catch{return null}}function Bu(t){const e=(t.options||[]).map(r=>({id:r.id,text:r.text})),s=(t.testCases||[]).map(r=>r.isHidden?{id:r.id,input:"",inputs:[],expectedOutput:"",isHidden:!0,weight:r.weight}:{...r}),{correctAnswers:a,rubric:n,explanation:i,...o}=t;return{...o,options:e,testCases:s,correctAnswers:void 0}}function br(t){return t!=null&&t.sections?{...t,sections:t.sections.map(e=>({...e,questions:(e.questions||[]).map(Bu)}))}:t}class Nu{constructor(){b(this,"state");b(this,"listeners",[]);b(this,"activeStreams",[]);b(this,"positionRestored",!1);b(this,"progressTimer",null);b(this,"policyLoading",!1);b(this,"lastCountedViolationAt",{});b(this,"terminateArmed",!1);const e=new URLSearchParams(window.location.search),s=e.get("assessment");this.state={isStaffAuthenticated:!1,currentUser:null,allowedPortals:[],authReady:!1,candidateInviteToken:e.get("invite"),liveCandidates:qu.map(a=>({...a})),settings:{...Pu},assessments:[...Kn],activeAssessmentId:s&&Kn.some(a=>a.id===s)?s:Kn[0].id,candidates:[...Du],candidateResults:{...Ru},questionBank:[...ca],activeCandidateId:"cand-3",otpVerified:!1,systemCheckCompleted:!1,examStarted:!1,examCompleted:!1,assessmentReady:!1,currentSectionIndex:0,currentQuestionIndex:0,sectionTimeRemainingSeconds:600,sectionEndsAtMs:null,candidateAnswers:{},codeSubmissions:{},codeDrafts:{},flaggedQuestions:new Set,candidateFeedback:null,isFullscreen:!1,violationCount:0,proctoringLogs:[],liveProctoringAlert:null,proctorIntercomMessage:null,theme:"dark"},L.setSessionExpiredHandler(()=>this.clearStaffSession())}toggleTheme(){this.state.theme=this.state.theme==="dark"?"light":"dark",this.state.theme==="light"?document.documentElement.classList.add("light-mode"):document.documentElement.classList.remove("light-mode"),this.notify()}getState(){return this.state}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(s=>s!==e)}}notify(){this.listeners.forEach(e=>e())}refresh(){this.notify()}registerMediaStream(e){e&&!this.activeStreams.includes(e)&&this.activeStreams.push(e)}getLiveCameraStream(){return this.activeStreams.find(e=>e.getVideoTracks().some(s=>s.readyState==="live"))||null}stopAllMediaStreams(){this.activeStreams.forEach(e=>{e&&e.getTracks&&e.getTracks().forEach(s=>{try{s.stop()}catch{}})}),this.activeStreams=[]}loginStaff(e){this.state.currentUser=e,this.state.allowedPortals=e.portals,this.state.isStaffAuthenticated=!0,this.notify(),e.mustChangePassword||this.loadPolicy("staff")}async loadPolicy(e){if(!this.policyLoading){this.policyLoading=!0;try{const[s,a]=await Promise.all([L.fetchJson("/policy/proctoring","GET",void 0,e),L.fetchJson("/policy/assessment","GET",void 0,e)]);this.state.settings={...this.state.settings,...s,...a},this.notify()}catch{}finally{this.policyLoading=!1}}}markAuthReady(){this.setAuthReady(!0)}setAuthReady(e){this.state.authReady!==e&&(this.state.authReady=e,this.notify())}clearStaffSession(){this.state.isStaffAuthenticated=!1,this.state.currentUser=null,this.state.allowedPortals=[],this.notify()}async logoutStaff(){try{await L.logout()}finally{this.clearStaffSession()}}candidateVerified(e){this.state.activeCandidateId=e.candidate.id,this.state.activeAssessmentId=e.candidate.assessmentId,this.state.assessmentReady=!1,this.state.otpVerified=!0,this.notify(),this.loadPolicy("candidate"),this.loadCandidateAssessment(e.candidate.assessmentId)}async loadCandidateAssessment(e){try{const s=await L.fetchJson("/candidate/assessment","GET",void 0,"candidate"),a=br(s),n=this.state.assessments.findIndex(i=>i.id===a.id||i.id===e);n>=0?this.state.assessments[n]=a:this.state.assessments.unshift(a),this.state.activeAssessmentId=a.id,this.state.assessmentReady=!0,this.applyServerProgress(s),this.state.examStarted&&this.state.sectionEndsAtMs==null&&this.jumpToFirstQuestion(!0),this.notify()}catch{this.state.assessmentReady=!1,this.notify()}}hydrateExam(e){this.state.activeCandidateId=e.candidateId,e.assessmentId&&(this.state.activeAssessmentId=e.assessmentId),this.state.otpVerified=e.otpVerified,this.state.systemCheckCompleted=e.systemCheckCompleted,this.state.examStarted=e.examStarted,this.state.examCompleted=e.examCompleted,this.state.currentSectionIndex=e.currentSectionIndex||0,this.state.currentQuestionIndex=e.currentQuestionIndex||0,this.state.sectionEndsAtMs=e.sectionEndsAtMs,this.state.sectionTimeRemainingSeconds=this.getSectionRemainingSeconds(),this.state.candidateAnswers={...e.answers||{}},this.state.codeDrafts=e.codeDrafts||{},this.state.flaggedQuestions=new Set(e.flagged||[]),this.positionRestored=!0,e.examStarted&&!e.examCompleted&&(L.fetchJson("/candidate/exam/start","POST",{},"candidate").catch(()=>null),this.loadCandidateAssessment(this.state.activeAssessmentId))}seedCodeDrafts(e){this.state.codeDrafts=e||{}}applyServerProgress(e){const s=e.progress;if(e.examStartedAt&&!this.state.examCompleted&&(this.state.examStarted=!0,this.state.systemCheckCompleted=!0),!s)return;if(!Object.values(this.state.codeDrafts).some(n=>Object.values(n.files||{}).some(i=>i.length>0))&&s.codeDrafts&&(this.state.codeDrafts=s.codeDrafts),!Object.keys(this.state.candidateAnswers).length&&s.answers&&(this.state.candidateAnswers={...s.answers}),this.state.sectionEndsAtMs==null&&s.sectionEndsAt){const n=Date.parse(s.sectionEndsAt);Number.isNaN(n)||(this.state.sectionEndsAtMs=n)}this.positionRestored||(typeof s.sectionIndex=="number"&&(this.state.currentSectionIndex=s.sectionIndex),typeof s.questionIndex=="number"&&(this.state.currentQuestionIndex=s.questionIndex),s.flagged&&(this.state.flaggedQuestions=new Set(s.flagged)),this.positionRestored=!0)}progressBody(){return{sectionIndex:this.state.currentSectionIndex,questionIndex:this.state.currentQuestionIndex,sectionEndsAt:this.state.sectionEndsAtMs?new Date(this.state.sectionEndsAtMs).toISOString():null,answers:this.state.candidateAnswers,codeDrafts:this.state.codeDrafts,flagged:Array.from(this.state.flaggedQuestions)}}persistExam(e=!1){const s=this.state.candidateInviteToken;!s||!this.state.otpVerified||(Ou({inviteToken:s,savedAt:Date.now(),candidateId:this.state.activeCandidateId,assessmentId:this.state.activeAssessmentId,otpVerified:this.state.otpVerified,systemCheckCompleted:this.state.systemCheckCompleted,examStarted:this.state.examStarted,examCompleted:this.state.examCompleted,currentSectionIndex:this.state.currentSectionIndex,currentQuestionIndex:this.state.currentQuestionIndex,sectionEndsAtMs:this.state.sectionEndsAtMs,answers:this.state.candidateAnswers,codeDrafts:this.state.codeDrafts,flagged:Array.from(this.state.flaggedQuestions)}),!(!this.state.examStarted||this.state.examCompleted)&&(this.progressTimer&&window.clearTimeout(this.progressTimer),this.progressTimer=window.setTimeout(()=>{this.progressTimer=null,L.fetchJson("/candidate/progress","PUT",this.progressBody(),"candidate").catch(()=>null)},e?0:700)))}flushExamProgress(){!this.state.otpVerified||!this.state.examStarted||this.state.examCompleted||(this.persistExam(),L.flushJson("/candidate/progress",this.progressBody(),"candidate"))}updateSettings(e){this.state.settings={...this.state.settings,...e},this.notify()}completeSystemCheck(){this.state.systemCheckCompleted=!0,this.notify()}startExam(){if(this.state.examStarted&&this.state.sectionEndsAtMs&&this.state.sectionEndsAtMs>Date.now()){this.positionRestored=!0,this.persistExam(!0),this.notify();return}this.state.examStarted=!0,this.state.examCompleted=!1,this.state.sectionEndsAtMs=null,this.terminateArmed=!1,this.lastCountedViolationAt={},this.jumpToFirstQuestion(!0),this.positionRestored=!0,this.notify(),L.fetchJson("/candidate/exam/start","POST",{},"candidate").catch(()=>null),this.persistExam(!0),this.state.activeCandidateId&&this.loadCandidateAssessment(this.state.activeAssessmentId)}getSectionRemainingSeconds(){return this.state.sectionEndsAtMs?Math.max(0,Math.ceil((this.state.sectionEndsAtMs-Date.now())/1e3)):Math.max(0,this.state.sectionTimeRemainingSeconds||0)}armSectionClock(e,s){const a=this.getActiveAssessment(),n=a!=null&&a.totalDurationMinutes&&a.totalDurationMinutes>0?a.totalDurationMinutes:e||60,i=Math.max(1,Math.round(n*60));if(this.state.sectionEndsAtMs&&this.state.sectionEndsAtMs>Date.now()){this.state.sectionTimeRemainingSeconds=this.getSectionRemainingSeconds();return}this.state.sectionEndsAtMs=Date.now()+i*1e3,this.state.sectionTimeRemainingSeconds=i,this.persistExam()}jumpToFirstQuestion(e=!1){const s=this.getActiveAssessment(),a=(s==null?void 0:s.sections)||[],n=a.findIndex(r=>(r.questions||[]).length>0),i=n>=0?n:0;this.state.currentSectionIndex=i,this.state.currentQuestionIndex=0;const o=a[this.state.currentSectionIndex];if(o){const r=(s==null?void 0:s.totalDurationMinutes)||o.timeLimitMinutes||60;this.armSectionClock(r,e)}}getActiveAssessment(){const e=this.state.assessments.find(s=>s.id===this.state.activeAssessmentId);return e&&this.state.otpVerified&&!this.state.isStaffAuthenticated?br(e):e}setAnswer(e,s,a=!0){this.state.candidateAnswers[e]=s,this.persistExam(),a&&this.notify()}noteCodeDraft(e,s,a){const n=this.state.codeDrafts[e]||{language:s,files:{}};n.language=s,n.files={...n.files,[s]:a},this.state.codeDrafts[e]=n,this.state.codeSubmissions[e]={...this.state.codeSubmissions[e]||{},code:a,language:s},this.state.candidateAnswers[e]={code:a,language:s},this.persistExam()}recallCode(e,s){var n,i;const a=(i=(n=this.state.codeDrafts[e])==null?void 0:n.files)==null?void 0:i[s];return typeof a=="string"?a:null}recallLanguage(e){var s;return((s=this.state.codeDrafts[e])==null?void 0:s.language)||null}setCodeSubmission(e,s){this.noteCodeDraft(e,s.language,s.code),this.state.codeSubmissions[e]={...this.state.codeSubmissions[e],...s}}toggleFlagQuestion(e){this.state.flaggedQuestions.has(e)?this.state.flaggedQuestions.delete(e):this.state.flaggedQuestions.add(e),this.persistExam(),this.notify()}nextQuestion(){var s;const e=(s=this.getActiveAssessment())==null?void 0:s.sections[this.state.currentSectionIndex];e&&this.state.currentQuestionIndex<e.questions.length-1&&(this.state.currentQuestionIndex++,this.persistExam(),this.notify())}prevQuestion(){this.state.currentQuestionIndex>0&&(this.state.currentQuestionIndex--,this.persistExam(),this.notify())}nextSection(){const e=this.getActiveAssessment(),s=(e==null?void 0:e.sections)||[];let a=this.state.currentSectionIndex+1;for(;a<s.length&&!(s[a].questions||[]).length;)a++;a<s.length?(this.state.currentSectionIndex=a,this.state.currentQuestionIndex=0,this.armSectionClock(s[a].timeLimitMinutes||15,!1),this.persistExam(),this.notify()):this.submitAssessment()}submitAssessment(){this.state.examStarted=!1,this.state.examCompleted=!0,this.state.sectionEndsAtMs=null,this.stopAllMediaStreams(),document.fullscreenElement&&document.exitFullscreen().catch(()=>{});const e=this.state.activeCandidateId||"cand-3",s=this.state.candidates.find(n=>n.id===e);s&&(s.status="Completed",s.assessmentCompleted=!0);const a={...this.state.candidateAnswers};Object.entries(this.state.codeDrafts).forEach(([n,i])=>{const o=i.language;a[n]={code:i.files[o]??"",language:o,files:i.files}}),L.fetchJson("/candidate/submit","POST",{answers:a},"candidate").catch(()=>null),this.notify()}async saveCandidateFeedback(e,s){await L.fetchJson("/candidate/feedback","POST",{rating:e,comment:s},"candidate"),this.markFeedbackSaved(e,s)}finishAndClose(e,s){L.postKeepalive("/candidate/feedback",{rating:e,comment:s},"candidate"),this.markFeedbackSaved(e,s)}markFeedbackSaved(e,s){this.state.candidateFeedback={rating:e,feedbackText:s,tags:[],submittedAt:new Date().toISOString()},$i(async()=>{const{candidateAssist:a}=await Promise.resolve().then(()=>Mr);return{candidateAssist:a}},void 0).then(({candidateAssist:a})=>a.reportFinished()),document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),this.notify()}logProctoringViolation(e,s,a="medium",n){if(!this.state.examStarted||this.state.examCompleted)return;const i=e==="No Face Detected"||e==="Multiple Faces"||e==="Object Detected"||e==="Mobile Phone Detected"||e==="Looking Away",o=Date.now();if(i&&o-(this.lastCountedViolationAt[e]||0)<8e3)return;this.lastCountedViolationAt[e]=o,this.state.violationCount++;const r={id:`viol-${Date.now()}`,candidateId:this.state.activeCandidateId||"cand-3",timestamp:new Date().toLocaleTimeString(),type:e,severity:a,snapshotUrl:n==null?void 0:n.snapshotUrl,description:s};this.state.proctoringLogs.unshift(r),this.state.liveProctoringAlert=`${e}: ${s}`,$i(()=>Promise.resolve().then(()=>Mr),void 0).then(d=>d.candidateAssist.reportViolation(e,a)).catch(()=>{});const l=this.state.liveCandidates.find(d=>d.candidateId===this.state.activeCandidateId);l&&(l.violations=this.state.violationCount,l.status=this.state.violationCount>=this.state.settings.maxTabSwitches?"warning":"normal",l.lastEvent=`${e} detected`),this.state.violationCount>=this.state.settings.maxViolationsBeforeTerminate&&!this.terminateArmed&&(this.terminateArmed=!0,this.state.liveProctoringAlert=`EXAM TERMINATED: Warning limit reached (${this.state.violationCount}/${this.state.settings.maxViolationsBeforeTerminate})`,window.setTimeout(()=>{this.state.examCompleted||this.submitAssessment()},1200)),this.notify()}clearProctoringAlert(){this.state.liveProctoringAlert!==null&&(this.state.liveProctoringAlert=null,this.notify())}registerCandidateIdentity(e,s,a,n){const i=this.state.candidates.find(o=>o.id===e);i?(s&&(i.livePhotoUrl=s),a&&(i.idProofUrl=a),n!=null&&n.name&&(i.name=n.name),n!=null&&n.email&&(i.email=n.email),i.identityStatus="pending_verification"):this.state.candidates.unshift({id:e,name:(n==null?void 0:n.name)||"Candidate",email:(n==null?void 0:n.email)||"",phone:"",experienceYears:0,skills:[],status:"Assessment Sent",assessmentId:this.state.activeAssessmentId,invitedAt:new Date().toLocaleDateString(),otpVerified:!0,systemCheckPassed:!0,assessmentCompleted:!1,livePhotoUrl:s,idProofUrl:a,identityStatus:"pending_verification"}),this.state.activeCandidateId=e}approveCandidateIdentity(e){const s=this.state.candidates.find(a=>a.id===e);s&&(s.identityStatus="approved"),this.state.activeCandidateId===e&&this.startExam(),this.notify()}triggerProctorIntercom(e,s){this.state.proctorIntercomMessage=s,this.state.liveProctoringAlert=`PROCTOR INTERCOM / 360° ROOM INSPECTION: ${s}`,this.notify()}clearProctorIntercom(){var e;this.state.proctorIntercomMessage=null,(e=this.state.liveProctoringAlert)!=null&&e.includes("PROCTOR INTERCOM")&&(this.state.liveProctoringAlert=null),this.notify()}addQuestionToBank(e){this.state.questionBank.unshift(e),this.notify()}addCandidate(e){this.state.candidates.unshift(e),this.notify()}updateCandidateStatus(e,s){const a=this.state.candidates.find(n=>n.id===e);a&&(a.status=s,this.notify())}updateCandidateDecision(e,s,a){this.state.candidateResults[e]&&(this.state.candidateResults[e].recruiterDecision=s,this.state.candidateResults[e].recruiterNotes=a,this.notify())}addQuestion(e,s){if(this.state.questionBank.unshift(e),s)this.assignQuestionToSection(s,e);else{const a=this.getActiveAssessment();a&&a.sections.length>0&&a.sections[0].questions.push(e)}this.notify()}assignQuestionToSection(e,s){const a=this.getActiveAssessment();if(!a)return;a.sections.forEach(i=>{i.questions=i.questions.filter(o=>o.id!==s.id)});let n=a.sections.find(i=>i.id===e||i.name.toLowerCase()===e.toLowerCase());n||(n={id:`sec-${Date.now()}`,name:e,description:"",isMandatory:!0,instructions:`Complete all questions in ${e}.`,timeLimitMinutes:15,passingMarks:s.points||20,randomizeQuestions:!0,questions:[]},a.sections.push(n)),n.questions.push(s),this.notify()}updateQuestion(e,s){const a=this.state.questionBank.findIndex(n=>n.id===e);a!==-1&&(this.state.questionBank[a]={...this.state.questionBank[a],...s},this.notify())}deleteQuestion(e){this.state.questionBank=this.state.questionBank.filter(a=>a.id!==e);const s=this.getActiveAssessment();s&&s.sections.forEach(a=>{a.questions=a.questions.filter(n=>n.id!==e)}),this.notify()}addAssessmentSection(e){const s=this.getActiveAssessment();s&&(s.sections.push(e),this.notify())}updateAssessmentSection(e,s){const a=this.getActiveAssessment();if(a){const n=a.sections.findIndex(i=>i.id===e);n!==-1&&(a.sections[n]={...a.sections[n],...s},this.notify())}}deleteAssessmentSection(e){const s=this.getActiveAssessment();s&&s.sections.length>1&&(s.sections=s.sections.filter(a=>a.id!==e),this.notify())}}const y=new Nu,rn=[{id:"python",label:"Python 3.11 (CPython)"},{id:"javascript",label:"JavaScript (Node.js)"},{id:"typescript",label:"TypeScript"},{id:"java",label:"Java"},{id:"cpp",label:"C++"},{id:"c",label:"C"},{id:"csharp",label:"C#"},{id:"go",label:"Go"},{id:"rust",label:"Rust"},{id:"kotlin",label:"Kotlin"},{id:"php",label:"PHP"},{id:"ruby",label:"Ruby"},{id:"swift",label:"Swift"},{id:"scala",label:"Scala"},{id:"sql",label:"SQL"},{id:"bash",label:"Bash"}],Hu={python:{before:`import sys

def solve(data: str) -> str:`,after:`    return ""

if __name__ == "__main__":
    sys.stdout.write(solve(sys.stdin.read()))`},javascript:{before:`const fs = require('fs');

function solve(data) {`,after:`  return '';
}

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(String(solve(input)));`},typescript:{before:`import fs from 'fs';

function solve(data: string): string {`,after:`  return '';
}

const input = fs.readFileSync(0, 'utf8');
process.stdout.write(solve(input));`},java:{before:`import java.nio.charset.StandardCharsets;

public class Main {
    static String solve(String data) {`,after:`        return "";
    }

    public static void main(String[] args) throws Exception {
        String data = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        System.out.print(solve(data));
    }
}`},cpp:{before:`#include <iostream>
#include <iterator>
#include <string>
using namespace std;

string solve(const string& data) {`,after:`    return "";
}

int main() {
    string data((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    cout << solve(data);
    return 0;
}`},c:{before:`#include <stdio.h>

void solve(const char *data) {`,after:`}

int main(void) {
    char buf[65536];
    size_t n = fread(buf, 1, sizeof(buf) - 1, stdin);
    buf[n] = '\\0';
    solve(buf);
    return 0;
}`},csharp:{before:`using System;

string Solve(string data) {`,after:`    return "";
}

var data = Console.In.ReadToEnd();
Console.Write(Solve(data));`},go:{before:`package main

import (
	"fmt"
	"io"
	"os"
)

func solve(data string) string {`,after:`	return ""
}

func main() {
	data, _ := io.ReadAll(os.Stdin)
	fmt.Print(solve(string(data)))
}`},rust:{before:`use std::io::{self, Read};

fn solve(data: &str) -> String {`,after:`    String::new()
}

fn main() {
    let mut data = String::new();
    io::stdin().read_to_string(&mut data).ok();
    print!("{}", solve(&data));
}`},kotlin:{before:"fun solve(data: String): String {",after:`    return ""
}

fun main() {
    val data = generateSequence(::readLine).joinToString("\\n")
    print(solve(data))
}`},php:{before:`<?php
function solve(string $data): string {`,after:`    return "";
}

$data = stream_get_contents(STDIN);
echo solve($data === false ? "" : $data);`},ruby:{before:"def solve(data)",after:`  ""
end

data = STDIN.read
print solve(data)`},swift:{before:`import Foundation

func solve(_ data: String) -> String {`,after:`    return ""
}

let data = String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""
print(solve(data), terminator: "")`},scala:{before:`object Main {
  def solve(data: String): String = {`,after:`    ""
  }

  def main(args: Array[String]): Unit = {
    val data = scala.io.Source.stdin.mkString
    print(solve(data))
  }
}`},sql:{before:`-- Write the query below.
SELECT`,after:";"},bash:{before:`#!/usr/bin/env bash
set -euo pipefail

solve() {`,after:`  printf '%s' ""
}

data="$(cat)"
solve "$data"`}};function Ei(t){const e=Hu[t];return e?{before:e.before,after:e.after}:{before:"",after:""}}function ud(t,e){const s=t==null?void 0:t[e];if(!s||typeof s=="string")return null;const a=String(s.before||""),n=String(s.after||"");return!a.trim()&&!n.trim()?null:{before:a,after:n}}function Ai(t,e,s){const a=t.replace(/\n+$/,""),n=s.replace(/^\n+/,""),i=e.replace(/^\n+|\n+$/g,""),o=[];return a&&o.push(a),o.push(i),n&&o.push(n),o.join(`
`)}function mr(t,e,s){const a=e.replace(/\n+$/,""),n=s.replace(/^\n+/,"");let i=t;if(a){if(!i.startsWith(a))return null;i=i.slice(a.length).replace(/^\n/,"")}if(n){if(!i.endsWith(n))return null;i=i.slice(0,i.length-n.length).replace(/\n$/,"")}return i}function Uu(t,e){const s=ud(t,e);if(s)return Ai(s.before,"",s.after);const a=t==null?void 0:t[e];if(typeof a=="string"&&a.trim())return a;const n=Ei(e);return!n.before.trim()&&!n.after.trim()?"":Ai(n.before,"",n.after)}function pd(t){const e=t==null?void 0:t.inputs;return Array.isArray(e)&&e.length>0?e.map(s=>String(s??"")):[(t==null?void 0:t.input)??""]}const Cs=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function xr(t){return t.map((e,s)=>`<div class="text-slate-400 text-[11px] whitespace-pre-wrap">Input ${s+1}: <code class="text-blue-300">${Cs(e)}</code></div>`).join("")}let Da=null,fa=null;function is(){try{fa==null||fa()}catch{}}class Vu{constructor(e,s){b(this,"container");b(this,"question");b(this,"currentLanguage");b(this,"currentCode","");b(this,"editorInstance",null);b(this,"parts",null);b(this,"middle","");b(this,"applying",!1);this.container=e,this.question=s,this.currentLanguage=y.recallLanguage(s.id)||s.language||"python",rn.some(a=>a.id===this.currentLanguage)||(this.currentLanguage="python"),this.loadBuffer(this.currentLanguage,y.recallCode(s.id,this.currentLanguage))}render(){this.container.innerHTML=`
      <div class="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div class="glass-panel px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Language:</span>
            <select id="lang-select" class="glass-input text-xs font-mono font-semibold px-3 py-1 rounded-lg border border-slate-700 bg-slate-950 focus:ring-1 focus:ring-blue-500">
              ${rn.map(e=>`
                <option value="${e.id}" ${this.currentLanguage===e.id?"selected":""}>${Cs(e.label)}</option>
              `).join("")}
            </select>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span id="draft-status" class="text-[10px] font-mono text-slate-500">Draft saved</span>
            <button id="run-code-btn" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700">
              <span>▶</span> Run Tests
            </button>
            <button id="submit-code-btn" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
              <span>✓</span> Submit Solution
            </button>
          </div>
        </div>
        <div class="flex-1 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-5 overflow-hidden">
          <div class="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950 min-h-0">
            ${this.parts?'<p class="px-3 py-1 text-[10px] text-blue-300/80 border-b border-slate-800">Write between the locked starter lines. Those lines stay as the recruiter set them.</p>':""}
            <div id="monaco-host" class="flex-1 w-full h-full min-h-[300px]"></div>
          </div>
          <div class="lg:col-span-2 flex flex-col bg-slate-900/90 overflow-hidden min-h-0">
            <div class="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Case Execution</span>
              <span id="exec-metrics" class="text-[11px] font-mono text-slate-400">Ready</span>
            </div>
            <div id="console-output" class="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3">
              <p class="text-slate-500 italic">Run Tests compiles this program and checks it against the question's cases.</p>
              ${(this.question.testCases||[]).map((e,s)=>`
                <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span class="font-semibold text-slate-300">Test Case ${s+1}</span>
                  ${e.isHidden?'<div class="text-slate-500 text-[11px] italic">Input and expected output are hidden.</div>':`
                    ${xr(pd(e))}
                    <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${Cs(e.expectedOutput)}</code></div>
                  `}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `,this.initMonaco(),this.attachEvents()}loadBuffer(e,s){this.currentLanguage=e;const a=ud(this.question.sampleCode,e),n=Uu(this.question.sampleCode,e),i=s!==null?s:n,o=a?mr(i,a.before,a.after):i;a&&o!==null?(this.parts=a,this.middle=o,this.currentCode=i):(this.parts=null,this.middle=i,this.currentCode=i)}initMonaco(){const e=this.container.querySelector("#monaco-host");if(!e)return;const s=window.monaco;if(s){this.createMonacoInstance(s,e);return}const a=window.require;if(a){a.config({paths:{vs:"https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs"}}),a(["vs/editor/editor.main"],()=>{this.container.querySelector("#monaco-host")&&this.createMonacoInstance(window.monaco,e)});return}this.renderTextareaFallback(e)}createMonacoInstance(e,s){if(Da){try{Da.dispose()}catch{}Da=null}s.innerHTML="",this.editorInstance=e.editor.create(s,{value:this.currentCode,language:this.monacoLanguage(this.currentLanguage),theme:"vs-dark",automaticLayout:!0,fontSize:13,fontFamily:"'Fira Code', 'JetBrains Mono', monospace",minimap:{enabled:!1},scrollBeyondLastLine:!1,lineNumbers:"on",roundedSelection:!0,tabSize:4,insertSpaces:!0,autoClosingBrackets:"always",autoClosingQuotes:"always",autoIndent:"full",formatOnType:!0,wordWrap:"on",scrollbar:{verticalScrollbarSize:8,horizontalScrollbarSize:8}}),Da=this.editorInstance,fa=()=>this.onBufferChanged(this.getCodeValue()),this.markEditable(e),this.editorInstance.onDidChangeModelContent(()=>{this.applying||this.onBufferChanged(this.editorInstance.getValue())})}markEditable(e){if(!this.parts||!this.editorInstance)return;const s=this.editorInstance.getModel();if(!s)return;const a=this.parts.before.trim()?this.parts.before.replace(/\n+$/,"").split(`
`).length:0,n=this.parts.after.trim()?this.parts.after.replace(/^\n+/,"").split(`
`).length:0,i=s.getLineCount(),o=a+1,r=Math.max(o,i-n),l=[];a>0&&l.push({range:new e.Range(1,1,a,1),options:{isWholeLine:!0,className:"bg-slate-900/40",glyphMarginClassName:""}}),l.push({range:new e.Range(o,1,r,1),options:{isWholeLine:!0,className:"bg-blue-500/10"}}),n>0&&i-n+1<=i&&l.push({range:new e.Range(i-n+1,1,i,1),options:{isWholeLine:!0}}),this.editorInstance.deltaDecorations([],l)}onBufferChanged(e){if(this.parts){const a=mr(e,this.parts.before,this.parts.after);if(a===null){const n=Ai(this.parts.before,this.middle,this.parts.after);this.pushValue(n),y.noteCodeDraft(this.question.id,this.currentLanguage,n);return}this.middle=a}else this.middle=e;this.currentCode=e,y.noteCodeDraft(this.question.id,this.currentLanguage,e);const s=this.container.querySelector("#draft-status");s&&(s.textContent="Draft saved")}pushValue(e){if(this.applying=!0,this.currentCode=e,this.editorInstance)this.editorInstance.setValue(e);else{const s=this.container.querySelector("#fallback-code-area");s&&(s.value=e)}this.applying=!1}monacoLanguage(e){return{python:"python",javascript:"javascript",typescript:"typescript",sql:"sql",cpp:"cpp",c:"c",java:"java",csharp:"csharp",go:"go",rust:"rust",kotlin:"kotlin",swift:"swift",php:"php",ruby:"ruby",scala:"scala",bash:"shell"}[e]||"plaintext"}renderTextareaFallback(e){e.innerHTML=`
      <textarea id="fallback-code-area" class="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm border-0 focus:ring-0 resize-none outline-none" spellcheck="false"></textarea>
    `;const s=e.querySelector("#fallback-code-area");s.value=this.currentCode,fa=()=>this.onBufferChanged(s.value),s.addEventListener("input",()=>{this.applying||this.onBufferChanged(s.value)})}getCodeValue(){if(this.editorInstance)return this.editorInstance.getValue();const e=this.container.querySelector("#fallback-code-area");return e?e.value:this.currentCode}attachEvents(){const e=this.container.querySelector("#lang-select"),s=this.container.querySelector("#run-code-btn"),a=this.container.querySelector("#submit-code-btn"),n=this.container.querySelector("#console-output"),i=this.container.querySelector("#exec-metrics");e==null||e.addEventListener("change",()=>{if(y.noteCodeDraft(this.question.id,this.currentLanguage,this.getCodeValue()),this.loadBuffer(e.value,y.recallCode(this.question.id,e.value)),this.editorInstance){const r=window.monaco;this.applying=!0,r==null||r.editor.setModelLanguage(this.editorInstance.getModel(),this.monacoLanguage(this.currentLanguage)),this.editorInstance.setValue(this.currentCode),this.applying=!1,this.markEditable(r)}else{const r=this.container.querySelector("#fallback-code-area");r&&(r.value=this.currentCode)}});const o=async()=>{s.disabled=!0,s.innerHTML="<span>⌛</span> Compiling...",i.textContent="Running...";const r=this.getCodeValue();y.noteCodeDraft(this.question.id,this.currentLanguage,r);let l;try{l=await Mu.executeCode(this.currentLanguage,r,this.question.id)}catch(c){return s.disabled=!1,s.innerHTML="<span>▶</span> Run Tests",i.textContent="Execution failed",n.textContent=c instanceof Error?c.message:String(c),null}s.disabled=!1,s.innerHTML="<span>▶</span> Run Tests",i.innerHTML=`Time: <b class="text-blue-400">${l.executionTimeMs}ms</b>`;const d=l.testResults.filter(c=>c.passed).length;return n.innerHTML=`
        ${l.stderr?`<pre class="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 whitespace-pre-wrap">${Cs(l.stderr)}</pre>`:""}
        <div class="p-3 rounded-xl border ${l.passed?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400":"bg-red-500/10 border-red-500/30 text-red-400"} flex items-center justify-between">
          <span class="font-bold uppercase tracking-wider">${l.passed?"All test cases passed":"Tests failed"}</span>
          <span class="font-mono font-bold">${d} / ${l.testResults.length}</span>
        </div>
        ${l.testResults.map((c,u)=>`
          <div class="p-3 rounded-xl bg-slate-950 border ${c.passed?"border-emerald-500/30":"border-red-500/30"} space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-slate-200">Test Case ${u+1}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${c.passed?"bg-emerald-500/20 text-emerald-400":"bg-red-500/20 text-red-400"}">${c.passed?"PASSED":"FAILED"}</span>
            </div>
            ${c.isHidden?'<div class="text-slate-500 text-[11px] italic">Output hidden.</div>':`
              ${xr(c.inputs&&c.inputs.length?c.inputs:[c.input])}
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Expected: <code class="text-emerald-300">${Cs(c.expected)}</code></div>
              <div class="text-slate-400 text-[11px] whitespace-pre-wrap">Actual: <code class="${c.passed?"text-emerald-400":"text-red-400"}">${Cs(c.actual)}</code></div>
            `}
          </div>
        `).join("")}
      `,l};s==null||s.addEventListener("click",()=>{o()}),a==null||a.addEventListener("click",async()=>{const r=await o(),l=this.getCodeValue();y.setCodeSubmission(this.question.id,{code:l,language:this.currentLanguage,executionTimeMs:r==null?void 0:r.executionTimeMs,passedCount:r==null?void 0:r.testResults.filter(d=>d.passed).length,totalCount:r==null?void 0:r.testResults.length}),a.innerHTML="<span>✓</span> Saved",a.classList.replace("bg-blue-600","bg-emerald-600")})}}const q={navy:"#0f2744",phone:"+1 (415) 215-3527",phoneHref:"tel:+14152153527",email:"partnerships@confered.com",bookUrl:"https://outlook.office.com/book/MediaLearningTechnologyConsultationDigiVisionConferED@confered.com/?ismsaljsauthenabled",site:"https://www.confered.com",locations:"Aurora, CO · Huntersville, NC · Hayden, ID",copyright:"Copyright 2026 ConferED LLC. All rights reserved.",since:"Digital conference recording since 2006"},ya={admin:{key:"admin",name:"System Administrator",badge:"Security & Governance",accentColor:"#3b82f6",accentLight:"rgba(59, 130, 246, 0.12)",accentBorder:"rgba(59, 130, 246, 0.35)",gradient:"from-blue-600 to-indigo-600",hoverGradient:"hover:from-blue-500 hover:to-indigo-500",shadowGlow:"shadow-blue-600/25",icon:"🛡️",tagline:"Staff accounts, role management, audit logs, and global security policies.",features:["Staff IAM & Permissions","Audit Logs & IP Tracking","Global Proctoring Rules"]},recruiter:{key:"recruiter",name:"Recruiter & HR Workspace",badge:"Talent Pipeline",accentColor:"#6366f1",accentLight:"rgba(99, 102, 241, 0.12)",accentBorder:"rgba(99, 102, 241, 0.35)",gradient:"from-indigo-600 to-purple-600",hoverGradient:"hover:from-indigo-500 hover:to-purple-500",shadowGlow:"shadow-indigo-600/25",icon:"💼",tagline:"Build multi-section exams, question banks, invite candidates, and evaluate scores.",features:["Automated Coding IDE","Question Bank Manager","Candidate Pipeline Tracking"]},proctor:{key:"proctor",name:"Live Proctoring Monitor",badge:"Real-Time Proctor Deck",accentColor:"#10b981",accentLight:"rgba(16, 185, 129, 0.12)",accentBorder:"rgba(16, 185, 129, 0.35)",gradient:"from-emerald-600 to-teal-600",hoverGradient:"hover:from-emerald-500 hover:to-teal-500",shadowGlow:"shadow-emerald-600/25",icon:"📹",tagline:"Live multi-camera streaming, real-time AI violation alerts, and direct proctor intercom.",features:["Zero-Latency Live Grid","Automated AI Violation Feed","Two-Way Audio Intercom"]}},hd=(t="onDark",e="h-11 sm:h-12 md:h-14 w-auto")=>`<img src="/confered-logo.png" alt="ConferED — Capture. Transform. Engage." class="${e} object-contain transition-opacity hover:opacity-95 shrink-0" />`,wn={admin:[{tab:"overview",icon:"📊",label:"Dashboard & Health",slug:"dashboard"},{tab:"staff",icon:"👥",label:"Staff Management",slug:"staff-management"},{tab:"settings",icon:"⚙️",label:"Global System Settings",slug:"global-system-settings"},{tab:"audit",icon:"📜",label:"Audit Logs",slug:"audit-logs"}],recruiter:[{tab:"pipeline",icon:"📊",label:"Hiring Overview",slug:"hiring-overview"},{tab:"candidate-evaluations",icon:"🎯",label:"Candidate Assessments",slug:"candidate-assessments"},{tab:"assessment-builder",icon:"🛠️",label:"Assessment Builder",slug:"assessment-builder"},{tab:"question-bank",icon:"🗂️",label:"Question Bank",slug:"question-bank"}],proctor:[{tab:"live",icon:"📹",label:"Live Monitoring"},{tab:"identity-verification",icon:"📸",label:"Identity & ID Verification",slug:"identity-verification"}]},Os={admin:"overview",recruiter:"pipeline",proctor:"live"},bs={...Os},Fs=t=>wn[t].some(s=>s.tab===bs[t])?bs[t]:Os[t],Gu=(t,e)=>{bs[t]=e},Ju=(t,e)=>{if(t==="recruiter"&&e.startsWith("candidates/")){bs[t]="candidate-evaluations";return}if(t==="recruiter"&&(e==="hiringpipeline"||e==="pipeline"||e==="hiring-overview"||!e)){bs[t]="pipeline";return}const s=wn[t].find(a=>(a.slug||"")===e);bs[t]=s?s.tab:Os[t]},Wu=()=>{Object.keys(Os).forEach(t=>{bs[t]=Os[t]})},fd=["admin","recruiter","proctor"],jt={admin:{portal:"admin",path:"/admin",role:"System Admin",title:"System Administrator",loginTitle:"System Admin Portal",icon:"🛡️",blurb:"Staff accounts, global settings and audit logs.",menuTitle:"Administration"},recruiter:{portal:"recruiter",path:"/recruiter",role:"Recruiter",title:"Recruiter / HR Workspace",loginTitle:"Recruiter Portal",icon:"💼",blurb:"Build assessments and the question bank, invite candidates and review results.",menuTitle:"Hiring"},proctor:{portal:"proctor",path:"/proctor",role:"Proctor",title:"Live Proctoring Monitor",loginTitle:"Proctoring Monitor",icon:"📹",blurb:"Verify identities, watch live sessions and act on violations.",menuTitle:"Proctoring"}};function Bs(){const t=window.location.pathname.replace(/\/+$/,"")||"/";for(const e of fd){const s=jt[e].path;if(t===s||t.startsWith(`${s}/`))return{kind:"staff",portal:e,section:t===s?"":t.slice(s.length+1)}}return{kind:"candidate"}}function Aa(t,e,s=""){const a=wn[t].find(o=>o.tab===e),n=jt[t].path,i=a!=null&&a.slug?`${n}/${a.slug}`:n;return s?`${i}#${s}`:i}function eo(t){return Aa(t,Os[t])}const bd=[];let gr=!1;function vr(){bd.forEach(t=>t())}const ye={navigate(t){const e=window.location.pathname+window.location.search+window.location.hash;t!==e&&(window.history.pushState({},"",t),vr())},subscribe(t){bd.push(t),gr||(gr=!0,window.addEventListener("popstate",vr))}},qe=q.site;class Qu{constructor(e,s="full"){b(this,"container");b(this,"mode");this.container=e,this.mode=s}render(){this.mode==="small"?this.renderSmall():this.renderFull()}renderSmall(){this.container.innerHTML=`
      <footer class="mt-auto border-t border-slate-800/80 text-slate-400 text-xs py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 transition-colors select-none" style="background: #081628;">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 font-sans">
          <div class="text-slate-400 text-xs">
            Copyright 2026 ConferED LLC. All rights reserved.
          </div>

          <div class="flex items-center gap-3.5 text-xs">
            <a href="${q.phoneHref}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#f43f5e]">📞</span>
              <span>${q.phone}</span>
            </a>
            <span class="text-slate-600">·</span>
            <a href="mailto:${q.email}" class="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <span class="text-[#818cf8]">✉️</span>
              <span>${q.email}</span>
            </a>
          </div>
        </div>
      </footer>
    `}renderFull(){this.container.innerHTML=`
      <footer class="mt-auto text-white" style="background:${q.navy}">
        <div class="max-w-7xl mx-auto px-6 lg:px-10 pt-12 pb-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            
            <!-- Brand Column -->
            <div class="space-y-4">
              <a href="/" data-route="/" class="inline-block hover:opacity-90">
                ${hd("onDark","h-11 sm:h-12 w-auto")}
              </a>
              <p class="text-sm leading-relaxed text-white/70">
                ConferED Talent Assess delivers high-stakes, AI-monitored technical and cognitive assessments for organizations, universities, and associations.
              </p>
              <p class="text-sm text-white/65">${q.locations}</p>
              <div class="space-y-1.5 text-sm">
                <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer" class="block font-semibold text-white hover:text-orange-400">Book a consultation</a>
                <a href="${q.phoneHref}" class="block text-white/80 hover:text-white">${q.phone}</a>
                <a href="mailto:${q.email}" class="block text-white/80 hover:text-white">${q.email}</a>
              </div>
            </div>

            <!-- Products Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Products</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="/" data-route="/" class="text-white hover:text-orange-400">Talent Assess</a></li>
                <li><a href="/recruiter" data-route="/recruiter" class="text-white hover:text-orange-400">Recruiter Workspace</a></li>
                <li><a href="/proctor" data-route="/proctor" class="text-white hover:text-orange-400">Live Proctoring</a></li>
                <li><a href="/admin" data-route="/admin" class="text-white hover:text-orange-400">System Admin</a></li>
                <li><a href="${qe}/lms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">ConferLMS</a></li>
                <li><a href="${qe}/digivision-media" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">DigiVision Media</a></li>
              </ul>
            </div>

            <!-- Company Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Company</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${qe}/who-we-serve" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Who we serve</a></li>
                <li><a href="${qe}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Associations</a></li>
                <li><a href="${qe}/experience" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Experience</a></li>
                <li><a href="${qe}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partners</a></li>
                <li><a href="${qe}/about" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">About ConferED</a></li>
                <li><a href="${qe}/careers" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Careers</a></li>
              </ul>
            </div>

            <!-- Talk Column -->
            <div>
              <h2 class="text-[11px] font-bold tracking-[0.16em] uppercase text-white/80 mb-4">Talk to Us</h2>
              <ul class="space-y-2.5 text-sm">
                <li><a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer" class="block text-white hover:text-orange-400 font-semibold">📅 Book a consultation</a></li>
                <li><a href="${qe}/contact" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Contact & Support</a></li>
                <li><a href="${qe}/partners" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Partnerships</a></li>
                <li><a href="${qe}/privacy" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Privacy Policy</a></li>
                <li><a href="${qe}/terms" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Terms of Service</a></li>
                <li><a href="${qe}/cookies" target="_blank" rel="noopener noreferrer" class="text-white hover:text-orange-400">Cookie Settings</a></li>
              </ul>
            </div>
          </div>

          <div class="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
            <p>${q.copyright} · ${q.since}</p>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    `,this.container.querySelectorAll("[data-route]").forEach(e=>{e.addEventListener("click",s=>{s.preventDefault(),ye.navigate(e.getAttribute("data-route")||"/")})})}}const qa=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class zu{constructor(e){b(this,"container");b(this,"mobileMenuOpen",!1);this.container=e}render(){const e=y.getState(),s=Bs(),a=e.currentUser,n=new URLSearchParams(window.location.search),i=n.has("invite")||n.has("assessment"),o=s.kind==="staff"&&e.isStaffAuthenticated&&!!a,r=s.kind==="staff"&&!e.isStaffAuthenticated,l=!!e.examStarted,d=!o&&!r&&!l&&!i;this.container.innerHTML=`
      <header class="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 backdrop-blur-md border-b border-slate-800 bg-[#070e17]/95 text-slate-100 shadow-xl transition-all">
        <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <!-- Left: Logo (clickable redirect) + Divider + "Talent Assess" (medium text, non-clickable) -->
          <div class="flex items-center gap-3 sm:gap-4 shrink-0">
            <a href="/" id="brand-logo-btn" class="inline-flex items-center shrink-0 ${i?"pointer-events-none":"cursor-pointer hover:opacity-90 transition-opacity"}" title="ConferED Home">
              ${hd("onDark","h-11 sm:h-12 md:h-13 w-auto")}
            </a>
            <div class="h-7 sm:h-8 w-px bg-slate-700/80 mx-0.5 select-none pointer-events-none"></div>
            <span class="text-sm sm:text-base font-medium tracking-normal text-slate-200 select-none whitespace-nowrap cursor-default pointer-events-none">
              Talent Assess
            </span>
          </div>

          <!-- Center: Main ConferED Platform Navigation Tabs (ONLY on public pages, hidden after login) -->
          ${d?`
            <nav class="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-200">
              
              <!-- Solutions Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Solutions</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-72 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${q.site}/who-we-serve/associations" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Associations & Societies</div>
                      <div class="text-[11px] text-slate-400">Annual conferences, member portals, and continuing education.</div>
                    </a>
                    <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Organizations & Enterprise</div>
                      <div class="text-[11px] text-slate-400">High-stakes talent assessment, certifications, and compliance.</div>
                    </a>
                    <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Healthcare & Medical</div>
                      <div class="text-[11px] text-slate-400">CME accredited video archives and proctored clinical evaluations.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Products Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Products</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-80 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="#workspaces-section" class="nav-internal-link block p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                      <div class="font-semibold text-blue-400 text-xs flex items-center justify-between">
                        <span>Talent Assess Suite</span>
                        <span class="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300">Active</span>
                      </div>
                      <div class="text-[11px] text-slate-300">Enterprise AI proctoring, coding IDE, and automated grading.</div>
                    </a>
                    <a href="${q.site}/lms" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">ConferLMS</div>
                      <div class="text-[11px] text-slate-400">Next-gen learning platform built for continuing education.</div>
                    </a>
                    <a href="${q.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">DigiVision Media</div>
                      <div class="text-[11px] text-slate-400">Conference video capture and synchronized slide recording.</div>
                    </a>
                    <a href="${q.site}/event-capture" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Virtual & Hybrid Events</div>
                      <div class="text-[11px] text-slate-400">End-to-end event broadcasting and live attendee streaming.</div>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Standalone Direct Tabs -->
              <a href="${q.site}/experience" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Experience
              </a>

              <a href="${q.site}/partners" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Partners
              </a>

              <!-- Company Dropdown -->
              <div class="relative group">
                <button class="flex items-center gap-1.5 py-2 hover:text-white transition-colors focus:outline-none">
                  <span>Company</span>
                  <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div class="absolute left-0 top-full pt-2 w-64 invisible opacity-0 -translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                  <div class="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1">
                    <a href="${q.site}/about" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">About ConferED</div>
                      <div class="text-[11px] text-slate-400">Delivering digital conference technology since 2006.</div>
                    </a>
                    <a href="${q.site}/why-confered" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Why ConferED</div>
                      <div class="text-[11px] text-slate-400">Our customer-first media and assessment architecture.</div>
                    </a>
                    <a href="${q.site}/careers" target="_blank" rel="noopener noreferrer" class="block p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                      <div class="font-semibold text-white text-xs">Careers</div>
                      <div class="text-[11px] text-slate-400">Join our engineering and operations team.</div>
                    </a>
                  </div>
                </div>
              </div>

              <a href="${q.site}/contact" target="_blank" rel="noopener noreferrer" class="py-2 hover:text-white transition-colors">
                Contact
              </a>
            </nav>
          `:""}

          <!-- Right Controls: Book a consultation CTA + Staff Info -->
          <div class="flex items-center gap-3">
            
            ${r?`
              <button id="back-to-home-btn" class="text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-1.5 shadow-sm">
                <span>←</span> <span>All Workspaces</span>
              </button>
            `:""}

            <!-- Official ConferED Orange "Book a consultation" button (Public pages only) -->
            ${d?`
              <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="hidden sm:inline-flex items-center justify-center font-bold text-xs sm:text-sm text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            `:""}

            <!-- Signed-in User Info & Logout (Staff Workspace) -->
            ${o?this.staffControlsHtml():""}

            <!-- Exam Recording Badge (Active Candidate Exam) -->
            ${l?`
              <div class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-xs font-bold text-red-400 uppercase tracking-wider">Recording</span>
                <span class="text-[10px] font-bold text-slate-300">${e.violationCount}/${e.settings.maxViolationsBeforeTerminate}</span>
              </div>
            `:""}

            <!-- Mobile Menu Toggle Button (Hamburger) - Public pages only -->
            ${d?`
              <button id="mobile-menu-toggle-btn" class="xl:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/80 focus:outline-none" aria-label="Toggle navigation menu">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            `:""}

          </div>

        </div>

        <!-- Mobile Navigation Drawer (Public pages only) -->
        ${d?`
          <div id="mobile-nav-drawer" class="hidden xl:hidden border-t border-slate-800/80 mt-3 pt-4 pb-2 space-y-3">
            <div class="grid grid-cols-2 gap-2 text-xs font-medium text-slate-200">
              <a href="${q.site}/who-we-serve" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Solutions ➔
              </a>
              <a href="#workspaces-section" class="nav-internal-link p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Talent Assess ➔
              </a>
              <a href="${q.site}/lms" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                ConferLMS ➔
              </a>
              <a href="${q.site}/digivision-media" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                DigiVision Media ➔
              </a>
              <a href="${q.site}/experience" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Experience
              </a>
              <a href="${q.site}/partners" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Partners
              </a>
              <a href="${q.site}/about" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Company
              </a>
              <a href="${q.site}/contact" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800">
                Contact
              </a>
            </div>

            <div class="pt-2">
              <a href="${q.bookUrl}" target="_blank" rel="noopener noreferrer"
                 class="block w-full text-center font-bold text-xs text-white py-2.5 rounded-lg shadow"
                 style="background: #ff6a00;">
                Book a consultation
              </a>
            </div>
          </div>
        `:""}

      </header>
    `,this.attachEvents()}staffControlsHtml(){const e=y.getState().currentUser,a=(e.name||e.email||"User").split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase();return`
      <div class="flex items-center gap-2.5 pl-2">
        <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm" title="${qa(e.role)}">
          ${qa(a)}
        </div>
        <div class="flex flex-col text-left">
          <span class="text-xs font-bold leading-tight text-white">${qa(e.name||e.email)}</span>
          <span class="text-[10px] text-slate-400 leading-tight">${qa(e.role)}</span>
        </div>
      </div>

      <button id="logout-btn" class="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center gap-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-slate-700/80 shadow-sm ml-2">
        <span>🚪</span> <span>Logout</span>
      </button>
    `}attachEvents(){var n,i,o;const e=r=>this.container.querySelector(r);(n=e("#brand-logo-btn"))==null||n.addEventListener("click",r=>{r.preventDefault();const l=new URLSearchParams(window.location.search);if(l.has("invite")||l.has("assessment"))return;const d=Bs();d.kind==="staff"&&y.getState().isStaffAuthenticated?ye.navigate(eo(d.portal)):ye.navigate("/")}),(i=e("#back-to-home-btn"))==null||i.addEventListener("click",()=>{ye.navigate("/")}),(o=e("#logout-btn"))==null||o.addEventListener("click",()=>{y.logoutStaff().catch(()=>{})});const s=e("#mobile-menu-toggle-btn"),a=e("#mobile-nav-drawer");s&&a&&s.addEventListener("click",()=>{this.mobileMenuOpen=!this.mobileMenuOpen,this.mobileMenuOpen?a.classList.remove("hidden"):a.classList.add("hidden")}),this.container.querySelectorAll(".nav-internal-link").forEach(r=>{r.addEventListener("click",l=>{const d=(r.getAttribute("href")||"").replace("#",""),c=document.getElementById(d);c&&(l.preventDefault(),c.scrollIntoView({behavior:"smooth"}),a&&(a.classList.add("hidden"),this.mobileMenuOpen=!1))})})}}class Ku{constructor(e,s){b(this,"container");b(this,"active");this.container=e,this.active=s}render(){const e=y.getState(),s=Fs(this.active),a=ya[this.active],n=e.theme==="light";e.currentUser;const i=e.allowedPortals.length>1,o=r=>r?`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-3 bg-gradient-to-r ${a.gradient} ${a.shadowGlow}`:`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 ${n?"text-slate-600 hover:text-slate-900 hover:bg-slate-100":"text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"}`;this.container.innerHTML=`
      <div class="flex flex-col h-full justify-between space-y-6">
        
        <div class="space-y-5">
          <!-- Active Workspace Header Badge -->
          <div class="px-2 py-3 rounded-2xl border transition-all ${n?"bg-white border-slate-200/90 shadow-sm":"bg-slate-900/70 border-slate-800"}">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                   style="background:${a.accentLight}; border:1px solid ${a.accentBorder}">
                ${a.icon}
              </div>
              <div class="min-w-0 flex-1">
                <span class="block text-xs font-bold truncate ${n?"text-slate-900":"text-white"}">
                  ${a.name}
                </span>
                <span class="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
                </span>
              </div>
            </div>
          </div>

          <!-- Multi-Workspace Switcher (only shown if account has multiple permissions) -->
          ${i?`
            <div>
              <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Workspaces</p>
              <div class="space-y-1">
                ${e.allowedPortals.map(r=>{const l=ya[r],d=r===this.active;return`
                    <button data-portal="${r}" class="side-portal w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2.5
                            ${d?n?"bg-slate-100 text-blue-900 font-bold":"bg-slate-800 text-blue-400 font-bold":n?"text-slate-500 hover:bg-slate-50":"text-slate-400 hover:bg-slate-800/40"}">
                      <span class="text-sm leading-none">${l.icon}</span>
                      <span class="truncate">${l.name}</span>
                    </button>
                  `}).join("")}
              </div>
            </div>
          `:""}

          <!-- Portal Navigation Menu -->
          <nav class="space-y-1" aria-label="Portal sections">
            <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ${jt[this.active].menuTitle}
            </p>
            ${wn[this.active].map(r=>`
              <button data-nav-tab="${r.tab}" class="side-nav ${o(r.tab===s)}">
                <span class="text-base leading-none">${r.icon}</span>
                <span class="truncate">${r.label}</span>
              </button>
            `).join("")}
          </nav>
        </div>

      </div>
    `,this.container.querySelectorAll(".side-portal").forEach(r=>r.addEventListener("click",l=>{const d=l.currentTarget.getAttribute("data-portal");L.setActivePortal(d),ye.navigate(eo(d))})),this.container.querySelectorAll(".side-nav").forEach(r=>r.addEventListener("click",l=>{const d=l.currentTarget.getAttribute("data-nav-tab");ye.navigate(Aa(this.active,d))}))}}function ys(t){const e=new URLSearchParams;Object.entries(t).forEach(([a,n])=>{n!=null&&n!==""&&e.set(a,String(n))});const s=e.toString();return s?`?${s}`:""}const Ce=t=>L.fetchJson(t,"GET"),Ft=(t,e)=>L.fetchJson(t,"POST",e),Ra=(t,e)=>L.fetchJson(t,"PATCH",e),Yn=t=>L.fetchJson(t,"DELETE"),N={dashboard:{staff:()=>Ce("/admin/dashboard/staff"),security:t=>Ce(`/admin/dashboard/security${ys({hours:t})}`),activity:(t=10,e)=>Ce(`/admin/dashboard/activity${ys({limit:t,category:e})}`),invites:()=>Ce("/admin/dashboard/invites"),health:()=>Ce("/admin/dashboard/health"),probeEmail:()=>Ft("/admin/dashboard/health/email-probe")},staff:{search:t=>Ce(`/admin/staff/search${ys(t)}`),detail:t=>Ce(`/admin/staff/${t}`),create:t=>Ft("/admin/staff",t),setRole:(t,e)=>Ra(`/admin/staff/${t}`,{role:e}),setActive:(t,e)=>Ra(`/admin/staff/${t}`,{isActive:e}),updateProfile:(t,e)=>Ra(`/admin/staff/${t}/profile`,e),unlock:t=>Ft(`/admin/staff/${t}/unlock`),forceLogout:t=>Ft(`/admin/staff/${t}/force-logout`),resendCredentials:t=>Ft(`/admin/staff/${t}/resend-credentials`),resetPassword:t=>Ft(`/admin/staff/${t}/reset-password`),remove:t=>Yn(`/admin/staff/${t}`),restore:t=>Ft(`/admin/staff/${t}/restore`),sessions:t=>Ce(`/admin/staff/${t}/sessions`),endSession:(t,e)=>Yn(`/admin/staff/${t}/sessions/${encodeURIComponent(e)}`)},settings:{schema:()=>Ce("/admin/settings/schema"),all:()=>Ce("/admin/settings"),group:t=>Ce(`/admin/settings/${t}`),update:(t,e)=>Ra(`/admin/settings/${t}`,e),clearEmailPassword:()=>Yn("/admin/settings/email/password"),testEmail:t=>Ft("/admin/settings/email/test",t?{to:t}:{})},audit:{list:t=>Ce(`/admin/audit-logs${ys(t)}`),meta:()=>Ce("/admin/audit-logs/meta"),exportCsv:t=>{const{page:e,pageSize:s,...a}=t;return L.downloadFile(`/admin/audit-logs/export${ys(a)}`)},loginEvents:t=>Ce(`/admin/login-events${ys(t)}`)}},x=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Ve=t=>t instanceof V?t.message:"Something went wrong. Please try again.";function md(t,e){let s;return(...a)=>{window.clearTimeout(s),s=window.setTimeout(()=>t(...a),e)}}const Ti=t=>String(t).padStart(2,"0"),xd=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC";function to(t,e,s){const a={};for(const n of new Intl.DateTimeFormat("en-GB",{timeZone:e,day:"numeric",month:s,year:"numeric",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(t))n.type!=="literal"&&(a[n.type]=n.value);return a}function Ue(t){if(!t)return"—";const e=new Date(t);if(isNaN(e.getTime()))return"—";const s=to(e,xd(),"short"),a=s.hour==="24"?"00":s.hour;return`${s.day} ${s.month} ${s.year}, ${Ti(a)}:${Ti(s.minute)}`}function gd(t){if(!t)return"—";const e=new Date(t);if(isNaN(e.getTime()))return"—";const s=to(e,xd(),"short");return`${s.day} ${s.month} ${s.year}`}function Yu(t,e){const s=new Date(t);if(isNaN(s.getTime()))return"—";const a=to(s,"UTC","numeric"),n=a.hour==="24"?"00":a.hour;return e==="hour"?`${Ti(n)}:00`:`${Number(a.day)}/${Number(a.month)}`}function Ms(t,e=Date.now()){if(!t)return"never";const s=new Date(t).getTime();if(isNaN(s))return"—";const a=Math.max(0,Math.round((e-s)/1e3));return a<45?"just now":a<3600?`${Math.max(1,Math.round(a/60))} min ago`:a<86400?`${Math.round(a/3600)} h ago`:a<30*86400?`${Math.round(a/86400)} d ago`:gd(t)}function Xu(t){const e=Math.floor(t/86400),s=Math.floor(t%86400/3600),a=Math.floor(t%3600/60);return e?`${e}d ${s}h`:s?`${s}h ${a}m`:`${a}m ${t%60}s`}function Ci(t){if(!t)return"Unknown device";const e=t,s=/Edg\//.test(e)?"Edge":/OPR\//.test(e)?"Opera":/Firefox\//.test(e)?"Firefox":/Chrome\//.test(e)?"Chrome":/Safari\//.test(e)?"Safari":/python|httpx|curl/i.test(e)?"Script":"",a=/Windows/.test(e)?"Windows":/Android/.test(e)?"Android":/iPhone|iPad/.test(e)?"iOS":/Mac OS X/.test(e)?"macOS":/Linux/.test(e)?"Linux":"";return s&&a?`${s} on ${a}`:s||a||e.slice(0,40)}const Ka={green:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",red:"bg-red-500/10 text-red-400 border-red-500/20",amber:"bg-amber-500/10 text-amber-400 border-amber-500/20",blue:"bg-blue-500/10 text-blue-400 border-blue-500/20",purple:"bg-purple-500/10 text-purple-400 border-purple-500/20",slate:"bg-slate-500/10 text-slate-400 border-slate-500/20"};function _e(t,e="slate"){return`<span class="whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-bold border ${Ka[e]}">${x(t)}</span>`}let ss=null;function lt(t,e="info",s=4500){var o;(!ss||!ss.isConnected)&&(ss=document.createElement("div"),ss.className="fixed bottom-4 right-4 z-[120] flex flex-col gap-2 w-[min(24rem,calc(100vw-2rem))]",ss.setAttribute("aria-live","polite"),document.body.appendChild(ss));const a=e==="success"?Ka.green:e==="error"?Ka.red:Ka.blue,n=document.createElement("div");n.setAttribute("role",e==="error"?"alert":"status"),n.className=`menu-panel rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl flex items-start gap-2 ${a}`,n.innerHTML=`<span class="flex-1 break-words">${x(t)}</span><button class="font-bold opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>`;const i=()=>n.remove();(o=n.querySelector("button"))==null||o.addEventListener("click",i),ss.appendChild(n),window.setTimeout(i,e==="error"?Math.max(s,7e3):s)}function vd(t){return new Promise(e=>{const s=document.createElement("div");s.className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md overflow-y-auto",s.setAttribute("role","dialog"),s.setAttribute("aria-modal","true"),s.innerHTML=`
      <div class="min-h-full flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
          <h3 class="text-lg font-extrabold text-white">${x(t.title)}</h3>
          <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${x(t.message)}</p>
          <div class="flex justify-end gap-2 pt-2">
            <button data-act="cancel" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs">Cancel</button>
            <button data-act="ok" class="px-4 py-2 rounded-xl ${t.danger?"bg-red-600 hover:bg-red-500":"bg-blue-600 hover:bg-blue-500"} text-white font-bold text-xs">${x(t.confirmLabel||"Confirm")}</button>
          </div>
        </div>
      </div>`;const a=i=>{document.removeEventListener("keydown",n,!0),s.remove(),e(i)},n=i=>{i.key==="Escape"&&(i.stopPropagation(),a(!1))};s.addEventListener("click",i=>{var r;const o=(r=i.target.closest("[data-act]"))==null?void 0:r.getAttribute("data-act");o==="ok"?a(!0):(o==="cancel"||i.target===s||i.target.parentElement===s)&&a(!1)}),document.addEventListener("keydown",n,!0),document.body.appendChild(s),s.querySelector('[data-act="ok"]').focus()}).catch(()=>!1)}function yd(t){var n;const e=document.createElement("div");e.className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md overflow-y-auto",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.innerHTML=`
    <div class="min-h-full flex items-center justify-center p-4" data-backdrop>
      <div class="glass-panel w-full ${t.width||"max-w-md"} rounded-3xl border border-slate-800 p-7 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-lg font-extrabold text-white">${x(t.title)}</h3>
          <button data-close class="text-slate-400 hover:text-white font-bold" aria-label="Close">✕</button>
        </div>
        <div data-modal-body>${t.body}</div>
      </div>
    </div>`;const s=()=>{var i;document.removeEventListener("keydown",a),e.remove(),(i=t.onClose)==null||i.call(t)},a=i=>{i.key==="Escape"&&!document.querySelector('[role="dialog"].z-\\[110\\]')&&s()};return(n=e.querySelector("[data-close]"))==null||n.addEventListener("click",s),e.addEventListener("mousedown",i=>{i.target.hasAttribute("data-backdrop")&&s()}),document.addEventListener("keydown",a),document.body.appendChild(e),{root:e.querySelector("[data-modal-body]"),close:s}}function wd(t,e=[10,25,50,100]){const s=t.total===0?0:(t.page-1)*t.pageSize+1,a=Math.min(t.total,t.page*t.pageSize),n=(i,o,r)=>`<button data-page="${o}" ${r?"disabled":""} class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] disabled:opacity-40 disabled:cursor-not-allowed">${i}</button>`;return`
    <div class="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-400">
      <span>${t.total===0?"No results":`Showing <b class="text-slate-200">${s}–${a}</b> of <b class="text-slate-200">${t.total}</b>`}</span>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1.5">Rows
          <select data-page-size class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
            ${e.map(i=>`<option value="${i}" ${i===t.pageSize?"selected":""}>${i}</option>`).join("")}
          </select>
        </label>
        ${n("« First",1,t.page<=1)}${n("‹ Prev",t.page-1,t.page<=1)}
        <span class="px-1">Page <b class="text-slate-200">${t.page}</b> / ${t.pages}</span>
        ${n("Next ›",t.page+1,t.page>=t.pages)}${n("Last »",t.pages,t.page>=t.pages)}
      </div>
    </div>`}function Sd(t,e,s){var a;t.querySelectorAll("[data-page]").forEach(n=>n.addEventListener("click",()=>{n.disabled||e(Number(n.getAttribute("data-page")))})),(a=t.querySelector("[data-page-size]"))==null||a.addEventListener("change",n=>s(Number(n.currentTarget.value)))}function Zu(t,e=120){if(!t.length)return"";const a=Math.max(1,...t.map(c=>c.ok+c.bad)),n=600/t.length,i=Math.max(2,n*.7),o=(e-18)/a,r=t.map((c,u)=>{const h=u*n+(n-i)/2,p=c.ok*o,f=c.bad*o,g=e-16;return`<g><title>${x(c.label)}: ${c.ok} successful, ${c.bad} failed</title>
      ${c.ok?`<rect x="${h.toFixed(1)}" y="${(g-p).toFixed(1)}" width="${i.toFixed(1)}" height="${p.toFixed(1)}" rx="1.5" fill="#10b981"/>`:""}
      ${c.bad?`<rect x="${h.toFixed(1)}" y="${(g-p-f).toFixed(1)}" width="${i.toFixed(1)}" height="${f.toFixed(1)}" rx="1.5" fill="#ef4444"/>`:""}
      ${!c.ok&&!c.bad?`<rect x="${h.toFixed(1)}" y="${g-1}" width="${i.toFixed(1)}" height="1" fill="currentColor" opacity="0.2"/>`:""}
    </g>`}).join(""),l=Math.max(1,Math.ceil(t.length/6)),d=t.map((c,u)=>u%l===0?`<text x="${(u*n+n/2).toFixed(1)}" y="${e-3}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.55">${x(c.label)}</text>`:"").join("");return`<svg viewBox="0 0 600 ${e}" class="w-full text-slate-400" role="img" aria-label="Sign-ins over time" preserveAspectRatio="none">
    <line x1="0" y1="${e-16}" x2="600" y2="${e-16}" stroke="currentColor" opacity="0.2"/>${r}${d}</svg>`}function ep(t,e){const s=URL.createObjectURL(t),a=document.createElement("a");a.href=s,a.download=e,a.style.display="none",document.body.appendChild(a),a.click(),a.remove(),window.setTimeout(()=>URL.revokeObjectURL(s),1e3)}function tp(t){return navigator.clipboard.writeText(t).then(()=>!0,()=>!1)}const sp={auth:"blue",staff:"purple",security:"red",settings:"amber",system:"slate",candidate:"green"},yr={password_ok:"Password accepted",login_success:"Signed in",login_failed:"Sign-in refused",login_blocked:"Tried while locked",otp_failed:"Wrong passcode",account_locked:"Account locked",logout:"Signed out",rate_limited:"Rate limited"},Et={from:"",to:"",category:"",action:"",actor:"",success:"",search:"",order:"desc",page:1,pageSize:25},os={from:"",to:"",email:"",portal:"",event:"",success:"",order:"desc",page:1,pageSize:25},Y={tab:"trail",exporting:!1},Ze={data:null,error:"",loading:!1,open:new Set},ls={data:null,error:"",loading:!1};let Bt=null,de=null;function ap(t){Object.assign(Et,{from:"",to:"",category:"",action:"",actor:"",success:"",search:"",page:1},t),Y.tab="trail",Ze.data=null}const Re="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs",Oe=(t,e)=>`<label class="block"><span class="block text-[10px] font-bold uppercase text-slate-500 mb-1">${t}</span>${e}</label>`,wr=t=>["","true","false"].map(e=>`<option value="${e}" ${t===e?"selected":""}>${e===""?"Any result":e==="true"?"Succeeded":"Failed / refused"}</option>`).join("");class np{constructor(e){this.root=e}mount(){var e;de=this,this.root.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Audit Logs</h2>
            <p class="text-xs text-slate-400 mt-0.5">An append-only record of who did what and from where. Entries cannot be edited or deleted.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="inline-flex rounded-xl border border-slate-700 overflow-hidden" role="tablist">
              ${["trail","signins"].map(s=>`<button role="tab" aria-selected="${Y.tab===s}" data-tab="${s}" class="px-3 py-2 text-xs font-bold ${Y.tab===s?"bg-blue-600 text-white":"bg-slate-900 text-slate-400 hover:text-white"}">${s==="trail"?"Audit trail":"Sign-in history"}</button>`).join("")}
            </div>
            ${Y.tab==="trail"?`<button id="au-export" ${Y.exporting?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs disabled:opacity-60 whitespace-nowrap">${Y.exporting?"Exporting…":"📥 Export CSV"}</button>`:""}
          </div>
        </div>
        <div id="au-filters"></div>
        <div id="au-table"></div>
        <div id="au-pager"></div>
      </div>`,this.root.querySelectorAll("[data-tab]").forEach(s=>s.addEventListener("click",()=>{Y.tab=s.getAttribute("data-tab"),this.mount()})),(e=this.root.querySelector("#au-export"))==null||e.addEventListener("click",()=>void ip()),this.paintFilters(),this.paintTable(),Y.tab==="trail"?(ws(),Bt||N.audit.meta().then(s=>{Bt=s,de===this&&this.paintFilters()}).catch(()=>{})):Ss()}paintFilters(){var r;const e=this.root.querySelector("#au-filters");if(!e)return;const s=Et,a=os;e.innerHTML=Y.tab==="trail"?`
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        ${Oe("From (UTC)",`<input data-f="from" type="date" value="${x(s.from)}" class="${Re}" />`)}
        ${Oe("To (UTC)",`<input data-f="to" type="date" value="${x(s.to)}" class="${Re}" />`)}
        ${Oe("Category",`<select data-f="category" class="${Re}"><option value="">All</option>${((Bt==null?void 0:Bt.categories)||[]).map(l=>`<option value="${x(l)}" ${s.category===l?"selected":""}>${x(l)}</option>`).join("")}</select>`)}
        ${Oe("Action",`<select data-f="action" class="${Re}"><option value="">All</option>${((Bt==null?void 0:Bt.actions)||[]).map(l=>`<option value="${x(l)}" ${s.action===l?"selected":""}>${x(l)}</option>`).join("")}</select>`)}
        ${Oe("Done by",`<input data-f="actor" type="search" value="${x(s.actor)}" placeholder="email" class="${Re}" />`)}
        ${Oe("Result",`<select data-f="success" class="${Re}">${wr(s.success)}</select>`)}
        ${Oe("Search text",`<input data-f="search" type="search" value="${x(s.search)}" placeholder="words in the summary" class="${Re}" />`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>`:`
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        ${Oe("From (UTC)",`<input data-f="from" type="date" value="${x(a.from)}" class="${Re}" />`)}
        ${Oe("To (UTC)",`<input data-f="to" type="date" value="${x(a.to)}" class="${Re}" />`)}
        ${Oe("Email",`<input data-f="email" type="search" value="${x(a.email)}" placeholder="contains…" class="${Re}" />`)}
        ${Oe("Portal",`<select data-f="portal" class="${Re}">${["","admin","recruiter","proctor"].map(l=>`<option value="${l}" ${a.portal===l?"selected":""}>${l||"All portals"}</option>`).join("")}</select>`)}
        ${Oe("Event",`<select data-f="event" class="${Re}"><option value="">All events</option>${Object.entries(yr).map(([l,d])=>`<option value="${l}" ${a.event===l?"selected":""}>${d}</option>`).join("")}</select>`)}
        ${Oe("Result",`<select data-f="success" class="${Re}">${wr(a.success)}</select>`)}
        <div class="flex items-end gap-2"><button data-clear class="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button></div>
      </div>`;const n=Y.tab==="trail"?Et:os,i=()=>{n.page=1,Y.tab==="trail"?ws():Ss()},o=md(i,350);e.querySelectorAll("[data-f]").forEach(l=>{const d=l.getAttribute("data-f"),c=l instanceof HTMLInputElement&&l.type==="search";l.addEventListener(c?"input":"change",()=>{n[d]=l.value,(c?o:i)()})}),(r=e.querySelector("[data-clear]"))==null||r.addEventListener("click",()=>{Y.tab==="trail"?Object.assign(Et,{from:"",to:"",category:"",action:"",actor:"",success:"",search:"",page:1}):Object.assign(os,{from:"",to:"",email:"",portal:"",event:"",success:"",page:1}),this.paintFilters(),i()})}paintTable(){var l,d,c,u;const e=this.root.querySelector("#au-table"),s=this.root.querySelector("#au-pager");if(!e||!s)return;const a=Y.tab==="trail"?Ze:ls;if(!a.data){e.innerHTML=a.error?`<p class="text-xs text-red-400">${x(a.error)}</p><button id="au-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading…</p>',s.innerHTML="",(l=e.querySelector("#au-retry"))==null||l.addEventListener("click",()=>void(Y.tab==="trail"?ws():Ss()));return}const n=a.loading?"opacity-60":"",i=a.error?`<p class="text-xs text-red-400 mb-2">${x(a.error)}</p>`:"",o=h=>`<button data-order class="uppercase font-semibold hover:text-white">When ${h==="desc"?"▼":"▲"}</button>`;if(Y.tab==="trail"){const h=(((d=Ze.data)==null?void 0:d.items)||[]).map(p=>{const f=Ze.open.has(p.id);return`
          <tr class="hover:bg-slate-800/40 cursor-pointer align-top" data-row="${x(p.id)}" aria-expanded="${f}">
            <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${x(p.createdAt)}">${x(Ue(p.createdAt))}</td>
            <td class="py-2.5 px-3">${_e(p.category,sp[p.category]||"slate")}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-300 break-all">${x(p.action)}</td>
            <td class="py-2.5 px-3 text-slate-300 break-all">${x(p.actorEmail||"system")}${p.actorRole?`<div class="text-[10px] text-slate-500">${x(p.actorRole)}</div>`:""}</td>
            <td class="py-2.5 px-3 text-slate-200 break-words min-w-[14rem]">${x(p.summary)}</td>
            <td class="py-2.5 px-3 text-center" title="${p.success?"Succeeded":"Failed / refused"}">${p.success?'<span class="text-emerald-400">✓</span>':'<span class="text-red-400">✗</span>'}</td>
            <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${x(p.ipAddress||"")}</td>
          </tr>
          ${f?`<tr class="bg-slate-900/60"><td colspan="7" class="px-5 py-3 text-[11px] text-slate-400 space-y-1.5">
            ${p.targetType?`<p><b class="text-slate-300">Target:</b> ${x(p.targetType)} <span class="font-mono">${x(p.targetId||"")}</span></p>`:""}
            <p><b class="text-slate-300">Browser:</b> ${x(Ci(p.userAgent))}</p>
            ${p.details?`<div><b class="text-slate-300">Details:</b><pre class="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">${x(JSON.stringify(p.details,null,2))}</pre></div>`:""}
          </td></tr>`:""}`}).join("");e.innerHTML=`${i}<div class="overflow-x-auto ${n}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${o(Et.order)}</th>${["Category","Action","Done by","What happened","OK","IP address"].map(p=>`<th class="py-2.5 px-3 uppercase font-semibold">${p}</th>`).join("")}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${h||'<tr><td colspan="7" class="py-10 text-center text-slate-500">No audit entries match these filters.</td></tr>'}</tbody></table></div>`,e.querySelectorAll("[data-row]").forEach(p=>p.addEventListener("click",()=>{const f=p.getAttribute("data-row");Ze.open.has(f)?Ze.open.delete(f):Ze.open.add(f),this.paintTable()}))}else{const h=(((c=ls.data)==null?void 0:c.items)||[]).map(p=>`
        <tr class="hover:bg-slate-800/40">
          <td class="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono" title="${x(p.createdAt)}">${x(Ue(p.createdAt))}</td>
          <td class="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">${x(yr[p.event]||p.event)}</td>
          <td class="py-2.5 px-3">${p.success?_e("OK","green"):_e("Refused","red")}</td>
          <td class="py-2.5 px-3 text-slate-300 break-all">${x(p.email||"—")}</td>
          <td class="py-2.5 px-3 text-slate-400">${x(p.portal||"—")}</td>
          <td class="py-2.5 px-3 text-slate-400">${x((p.failureReason||"").replace(/_/g," "))}</td>
          <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">${x(p.ipAddress||"")}</td>
          <td class="py-2.5 px-3 text-slate-500">${x(Ci(p.userAgent))}</td>
        </tr>`).join("");e.innerHTML=`${i}<div class="overflow-x-auto ${n}"><table class="w-full text-left text-xs">
        <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]"><th class="py-2.5 px-3">${o(os.order)}</th>${["Event","Result","Email","Portal","Reason","IP address","Browser"].map(p=>`<th class="py-2.5 px-3 uppercase font-semibold">${p}</th>`).join("")}</tr></thead>
        <tbody class="divide-y divide-slate-800/60">${h||'<tr><td colspan="8" class="py-10 text-center text-slate-500">No sign-in events match these filters.</td></tr>'}</tbody></table></div>`}(u=e.querySelector("[data-order]"))==null||u.addEventListener("click",()=>{const h=Y.tab==="trail"?Et:os;h.order=h.order==="desc"?"asc":"desc",h.page=1,Y.tab==="trail"?ws():Ss()}),s.innerHTML=wd(a.data);const r=Y.tab==="trail"?Et:os;Sd(s,h=>{r.page=h,Y.tab==="trail"?ws():Ss()},h=>{r.pageSize=h,r.page=1,Y.tab==="trail"?ws():Ss()})}}const so=t=>Object.fromEntries(Object.entries(t).map(([e,s])=>[e,typeof s=="string"?s.trim():s]));async function ws(){Ze.loading=!0,de==null||de.paintTable();try{Ze.data=await N.audit.list(so(Et)),Ze.error=""}catch(t){Ze.error=Ve(t)}finally{Ze.loading=!1,Y.tab==="trail"&&(de==null||de.paintTable())}}async function Ss(){ls.loading=!0,de==null||de.paintTable();try{ls.data=await N.audit.loginEvents(so(os)),ls.error=""}catch(t){ls.error=Ve(t)}finally{ls.loading=!1,Y.tab==="signins"&&(de==null||de.paintTable())}}async function ip(){if(!Y.exporting){Y.exporting=!0,de==null||de.mount();try{const t=await N.audit.exportCsv(so(Et));ep(t.blob,t.filename),lt(t.truncated?`Exported the first 50,000 entries as ${t.filename}. Narrow the filters to get the rest.`:`Exported ${t.filename}.`,t.truncated?"info":"success")}catch(t){lt(Ve(t),"error")}finally{Y.exporting=!1,de==null||de.mount()}}}const Li=[{role:"Recruiter",label:"Recruiter / HR"},{role:"Proctor",label:"Live Proctor"},{role:"System Admin",label:"System Administrator"}],Sr={"System Admin":"purple",Recruiter:"blue",Proctor:"red"},op={"System Admin":"/admin",Recruiter:"/recruiter",Proctor:"/proctor"},rp=[["all","All accounts"],["active","Active"],["disabled","Disabled"],["locked","Locked out"],["pendingPassword","Awaiting new password"],["neverSignedIn","Never signed in"],["deleted","Deleted"]],lp={password_ok:"Password accepted",login_success:"Signed in",login_failed:"Wrong password / refused",login_blocked:"Tried while locked",otp_failed:"Wrong passcode",account_locked:"Account locked",logout:"Signed out",rate_limited:"Rate limited"},B={q:"",role:"",status:"all",department:"",sort:"createdAt",order:"desc",page:1,pageSize:25},Ls={data:null,error:"",loading:!1},M={id:null,detail:null,sessions:null,history:null,error:"",loading:!1,busy:!1,draft:{},role:""};let X=null,kr=!1;function dp(t){Object.assign(B,{q:"",role:"",status:"all",department:"",page:1},t),M.id=null}const cp=t=>{var e;return!!t&&((e=y.getState().currentUser)==null?void 0:e.id)===t},kd=t=>!!t.lockedUntil&&new Date(t.lockedUntil).getTime()>Date.now();function $r(t){if(t.deletedAt)return _e("Deleted","slate");const e=[t.isActive===!1?_e("Disabled","slate"):_e("Active","green")];return kd(t)&&e.push(_e("Locked out","red")),t.isActive!==!1&&t.mustChangePassword&&e.push(_e("Awaiting new password","amber")),`<div class="flex flex-col items-start gap-1">${e.join("")}</div>`}class up{constructor(e){this.root=e}mount(){var e;X=this,this.root.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Staff Management</h2>
            <p class="text-xs text-slate-400 mt-0.5">Create accounts, change roles, reset passwords and end sessions. New people get a temporary password and must choose their own at first sign-in.</p>
          </div>
          <button id="st-add" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md transition-all whitespace-nowrap">＋ Add Staff Member</button>
        </div>
        ${this.toolbarHtml()}
        <div id="st-table"></div>
        <div id="st-pager"></div>
      </div>
      <div id="st-drawer"></div>`,this.bindToolbar(),(e=this.root.querySelector("#st-add"))==null||e.addEventListener("click",()=>fp()),this.paintTable(),this.paintDrawer(),Gt(),M.id&&ao(M.id,!1),kr||(kr=!0,document.addEventListener("keydown",s=>{s.key==="Escape"&&M.id&&!document.querySelector('[role="dialog"][aria-modal="true"]')&&Xn()}))}toolbarHtml(){const e="glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs";return`
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
        <input id="st-q" type="search" value="${x(B.q)}" placeholder="Search name, email or department" class="${e} md:col-span-4" aria-label="Search staff" />
        <select id="st-role" class="${e} md:col-span-2" aria-label="Filter by role">
          <option value="">All roles</option>${Li.map(s=>`<option value="${s.role}" ${B.role===s.role?"selected":""}>${s.role}</option>`).join("")}
        </select>
        <select id="st-status" class="${e} md:col-span-3" aria-label="Filter by status">
          ${rp.map(([s,a])=>`<option value="${s}" ${B.status===s?"selected":""}>${a}</option>`).join("")}
        </select>
        <input id="st-dept" type="search" value="${x(B.department)}" placeholder="Department" class="${e} md:col-span-2" aria-label="Filter by department" />
        <button id="st-clear" class="md:col-span-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs">Clear</button>
      </div>`}bindToolbar(){const e=n=>this.root.querySelector(n),s=()=>{B.page=1,Gt()},a=md(s,300);e("#st-q").addEventListener("input",n=>{B.q=n.target.value,a()}),e("#st-dept").addEventListener("input",n=>{B.department=n.target.value,a()}),e("#st-role").addEventListener("change",n=>{B.role=n.target.value,s()}),e("#st-status").addEventListener("change",n=>{B.status=n.target.value,s()}),e("#st-clear").addEventListener("click",()=>{Object.assign(B,{q:"",role:"",status:"all",department:"",page:1}),e("#st-q").value="",e("#st-dept").value="",e("#st-role").value="",e("#st-status").value="all",Gt()})}paintTable(){var d,c;const e=this.root.querySelector("#st-table"),s=this.root.querySelector("#st-pager");if(!e||!s)return;const{data:a,error:n,loading:i}=Ls;if(!a){e.innerHTML=n?`<p class="text-xs text-red-400">${x(n)}</p><button id="st-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="py-8 text-center text-xs text-slate-500 font-mono">Loading staff accounts…</p>',s.innerHTML="",(d=e.querySelector("#st-retry"))==null||d.addEventListener("click",()=>void Gt());return}const o=(c=y.getState().currentUser)==null?void 0:c.id,r=(u,h)=>{const p=B.sort===u;return`<th class="py-2.5 px-3"><button data-sort="${u}" class="uppercase font-semibold hover:text-white inline-flex items-center gap-1 ${p?"text-blue-400":""}">${h}<span aria-hidden="true">${p?B.order==="asc"?"▲":"▼":""}</span></button></th>`},l=a.items.map(u=>`
      <tr class="hover:bg-slate-800/40 cursor-pointer ${u.deletedAt||u.isActive===!1?"opacity-70":""}" data-open="${x(u.id)}">
        <td class="py-2.5 px-3"><div class="font-bold text-white">${x(u.name)}${u.id===o?' <span class="text-[10px] text-slate-500 font-normal">(you)</span>':""}</div>
          <div class="font-mono text-blue-400 text-[11px] break-all">${x(u.email)}</div>
          ${u.department?`<div class="text-[10px] text-slate-500">${x(u.department)}</div>`:""}</td>
        <td class="py-2.5 px-3">${_e(u.role,Sr[u.role]||"slate")}</td>
        <td class="py-2.5 px-3">${$r(u)}</td>
        <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap" title="${x(Ue(u.lastLoginAt))}">${x(Ms(u.lastLoginAt))}</td>
        <td class="py-2.5 px-3 text-slate-300 text-center">${u.activeSessions}</td>
        <td class="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">${x(gd(u.createdAt))}</td>
        <td class="py-2.5 px-3 text-right"><button data-open-btn="${x(u.id)}" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px]">Manage</button></td>
      </tr>`).join("");e.innerHTML=`
      ${n?`<p class="text-xs text-red-400 mb-2">${x(n)}</p>`:""}
      <div class="overflow-x-auto ${i?"opacity-60":""}">
        <table class="w-full text-left text-xs">
          <thead><tr class="border-b border-slate-800 text-slate-400 text-[10px]">
            ${r("name","Person")}${r("role","Role")}<th class="py-2.5 px-3 uppercase font-semibold">Status</th>
            ${r("lastLoginAt","Last sign-in")}<th class="py-2.5 px-3 uppercase font-semibold text-center">Sessions</th>
            ${r("createdAt","Created")}<th class="py-2.5 px-3"></th>
          </tr></thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            ${l||'<tr><td colspan="7" class="py-10 px-3 text-center text-slate-500">No staff accounts match these filters.</td></tr>'}
          </tbody>
        </table>
      </div>`,s.innerHTML=wd(a),e.querySelectorAll("[data-sort]").forEach(u=>u.addEventListener("click",()=>{const h=u.getAttribute("data-sort");B.order=B.sort===h&&B.order==="asc"?"desc":B.sort===h?"asc":h==="createdAt"||h==="lastLoginAt"?"desc":"asc",B.sort=h,B.page=1,Gt()})),e.querySelectorAll("[data-open]").forEach(u=>u.addEventListener("click",()=>void pp(u.getAttribute("data-open")))),Sd(s,u=>{B.page=u,Gt()},u=>{B.pageSize=u,B.page=1,Gt()})}paintDrawer(){var o,r;const e=this.root.querySelector("#st-drawer");if(!e)return;if(!M.id){e.innerHTML="";return}const s=((o=e.querySelector("aside"))==null?void 0:o.scrollTop)??0,a=M.detail,n=a?this.drawerBody(a):`<p class="py-10 text-center text-xs ${M.error?"text-red-400":"text-slate-500 font-mono"}">${x(M.error||"Loading account…")}</p>`;e.innerHTML=`
      <div class="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" data-backdrop>
        <aside role="dialog" aria-label="Manage staff member" class="absolute right-0 top-0 h-full w-full max-w-xl menu-panel border-l border-slate-800 overflow-y-auto p-6 space-y-5 shadow-2xl">
          ${n}
        </aside>
      </div>`;const i=e.querySelector("aside");i.scrollTop=s,(r=e.querySelector("[data-backdrop]"))==null||r.addEventListener("mousedown",l=>{l.target===l.currentTarget&&Xn()}),a&&this.bindDrawer(e,a)}drawerBody(e){var p;const s=cp(e.id),a=!!e.deletedAt,n=M.busy?"disabled":"",i=(f,g)=>x(f in M.draft?M.draft[f]:g??""),o=(f,g,m,w,v={})=>`
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${f}">${g}</label>
        <input id="${f}" data-field="${m}" type="${v.type||"text"}" value="${i(m,w)}" ${v.disabled||a?"disabled":""} placeholder="${x(v.placeholder||"")}"
          class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white disabled:opacity-60" />
        ${v.hint?`<p class="text-[10px] text-slate-500 mt-1">${v.hint}</p>`:""}
      </div>`,r=(f,g,m="neutral",w="")=>`<button id="${f}" ${n} class="px-3 py-1.5 rounded-lg border font-bold text-[11px] disabled:opacity-50 ${m==="danger"?"bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300":m==="good"?"bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300":"bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"} ${w}">${g}</button>`,l=(f,g,m="")=>`
      <section ${m?`id="${m}"`:""} class="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-400">${f}</h4>${g}</section>`,d=(f,g)=>`<div><p class="text-[10px] uppercase font-bold text-slate-500">${f}</p><p class="text-xs text-slate-200 break-words">${g}</p></div>`,c=kd(e),u=M.sessions,h=((p=M.history)==null?void 0:p.items)||[];return`
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black shrink-0">${x((e.name||"?").trim().charAt(0).toUpperCase())}</div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-extrabold text-white break-words">${x(e.name)}${s?' <span class="text-xs text-slate-500 font-normal">(you)</span>':""}</h3>
          <p class="font-mono text-[11px] text-blue-400 break-all">${x(e.email)}</p>
          <div class="flex flex-wrap gap-1.5 mt-1.5">${_e(e.role,Sr[e.role]||"slate")}${$r(e).replace("flex flex-col items-start gap-1","flex flex-wrap gap-1.5")}</div>
        </div>
        <button id="dw-close" class="text-slate-400 hover:text-white font-bold text-lg leading-none" aria-label="Close">✕</button>
      </div>
      ${M.error?`<p class="text-xs font-semibold text-red-400 break-words">${x(M.error)}</p>`:""}

      ${l("Details",`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          ${o("dw-name","Full name","name",e.name)}
          ${o("dw-phone","Phone","phone",e.phone,{placeholder:"+91 98765 43210"})}
          ${o("dw-email","Login email","email",e.email,{disabled:s,type:"text"})}
          ${o("dw-otp","2FA email (passcodes go here)","otpEmail",e.otpEmail,{disabled:s,type:"text"})}
          <div class="sm:col-span-2">${o("dw-dept","Department","department",e.department)}</div>
        </div>
        ${s?'<p class="text-[10px] text-slate-500">You cannot change your own login or 2FA email (a typo could lock you out). Ask another System Admin.</p>':""}
        ${!s&&!a?'<p class="text-[10px] text-slate-500">Changing the login or 2FA email signs the person out everywhere and notifies their previous address.</p>':""}
        <div class="flex justify-end">${r("dw-save","Save changes","good",a?"hidden":"")}</div>`)}

      ${a?l("This account is deleted",`
        <p class="text-xs text-slate-300">Deleted ${x(Ue(e.deletedAt))}. It cannot sign in. Restoring brings it back <b>disabled</b>, and the person must set a new password.</p>
        <div>${r("dw-restore","↩ Restore account","good")}</div>`):`

      ${l("Access",`
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs items-end">
          <div>
            <label class="block font-semibold text-slate-300 mb-1" for="dw-role">Role / portal</label>
            <select id="dw-role" ${s||M.busy?"disabled":""} class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-semibold disabled:opacity-60">
              ${Li.map(f=>`<option value="${f.role}" ${(M.role||e.role)===f.role?"selected":""}>${f.label}</option>`).join("")}
            </select>
          </div>
          <div class="flex gap-2">${r("dw-role-apply","Change role","neutral",s||(M.role||e.role)===e.role?"hidden":"")}
            ${s?"":r("dw-toggle",e.isActive===!1?"Activate":"Deactivate",e.isActive===!1?"good":"danger")}</div>
        </div>
        ${s?'<p class="text-[10px] text-slate-500">You cannot change your own role or status.</p>':""}`)}

      ${l("Security",`
        <div class="grid grid-cols-2 gap-3">
          ${d("Last sign-in",e.lastLoginAt?`${x(Ue(e.lastLoginAt))} <span class="text-slate-500">(${x(Ms(e.lastLoginAt))})</span>`:"Never")}
          ${d("Password changed",x(Ue(e.passwordChangedAt)))}
          ${d("Failed attempts",String(e.failedLogins))}
          ${d("Lockout",c?`<span class="text-red-400 font-semibold">until ${x(Ue(e.lockedUntil))}</span>`:"None")}
          ${d("Created",`${x(Ue(e.createdAt))}${e.createdByEmail?` by ${x(e.createdByEmail)}`:""}`)}
          ${d("Password status",e.mustChangePassword?'<span class="text-amber-400 font-semibold">Must choose a new password</span>':"Chosen by the user")}
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          ${c||e.failedLogins>0?r("dw-unlock","🔓 Unlock","good"):""}
          ${s?"":r("dw-reset","🔑 Reset password")}
          ${!s&&e.mustChangePassword&&e.isActive!==!1?r("dw-resend","✉ Resend credentials"):""}
          ${s?"":r("dw-logout","⏻ Force sign-out everywhere","danger")}
        </div>`)}

      ${l(`Active sessions${u?` (${u.length})`:""}`,u===null?'<p class="text-xs text-slate-500 font-mono">Loading…</p>':u.length===0?'<p class="text-xs text-slate-500">Not signed in anywhere.</p>':`<ul class="space-y-2">${u.map(f=>`
            <li class="flex items-center gap-3 rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2">
              <div class="min-w-0 flex-1 text-xs">
                <p class="font-semibold text-slate-200">${x(Ci(f.userAgent))} <span class="font-mono text-slate-500 font-normal">${x(f.ipAddress||"")}</span></p>
                <p class="text-[10px] text-slate-500">Signed in ${x(Ue(f.startedAt))} • last active ${x(Ms(f.lastActiveAt))} • expires ${x(Ue(f.expiresAt))}</p>
              </div>
              <button data-end-session="${x(f.id)}" ${n} class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-red-300 font-bold text-[11px] disabled:opacity-50">End</button>
            </li>`).join("")}</ul>`)}

      ${l("Recent sign-in activity",h.length===0?`<p class="text-xs text-slate-500">${M.history?"No sign-in activity recorded yet.":"Loading…"}</p>`:`<ul class="divide-y divide-slate-800/60">${h.map(f=>`
          <li class="py-1.5 flex items-center gap-2 text-[11px]">
            <span class="w-1.5 h-1.5 rounded-full ${f.success?"bg-emerald-500":"bg-red-500"}"></span>
            <span class="text-slate-200 font-semibold">${x(lp[f.event]||f.event)}</span>
            ${f.failureReason?`<span class="text-slate-500">(${x(f.failureReason.replace(/_/g," "))})</span>`:""}
            <span class="ml-auto text-slate-500 font-mono">${x(f.ipAddress||"")}</span>
            <span class="text-slate-500 whitespace-nowrap" title="${x(Ue(f.createdAt))}">${x(Ms(f.createdAt))}</span>
          </li>`).join("")}</ul>`)}

      ${s?"":l("Danger zone",`
        <p class="text-xs text-slate-400">Deleting removes the account from lists and blocks sign-in at once. The history stays in the audit log and the account can be restored.</p>
        <div>${r("dw-delete","🗑 Delete account","danger")}</div>`)}`}`}bindDrawer(e,s){var n;const a=(i,o)=>{var r;return(r=e.querySelector(`#${i}`))==null?void 0:r.addEventListener("click",o)};a("dw-close",Xn),e.querySelectorAll("input[data-field]").forEach(i=>i.addEventListener("input",()=>{M.draft[i.getAttribute("data-field")]=i.value})),(n=e.querySelector("#dw-role"))==null||n.addEventListener("change",i=>{M.role=i.target.value,this.paintDrawer()}),a("dw-save",()=>void hp(s)),a("dw-role-apply",()=>{const i=M.role||s.role;gt({title:"Change role?",confirmLabel:"Change role",danger:!0,message:`${s.name} will move from ${s.role} to ${i}. They are signed out everywhere and must use the ${i} portal.`},async()=>(await N.staff.setRole(s.id,i),M.role="",`${s.name} is now ${i}.`))}),a("dw-toggle",()=>{const i=s.isActive===!1;gt(i?null:{title:"Deactivate account?",confirmLabel:"Deactivate",danger:!0,message:`${s.name} is signed out immediately and cannot sign in until you activate the account again.`},async()=>(await N.staff.setActive(s.id,i),i?`${s.name} can sign in again.`:`${s.name} was deactivated.`))}),a("dw-unlock",()=>void gt(null,async()=>(await N.staff.unlock(s.id),`${s.name} was unlocked.`))),a("dw-reset",()=>void gt({title:"Reset password?",confirmLabel:"Reset password",danger:!0,message:`A new temporary password is created and emailed. ${s.name} is signed out everywhere and must choose their own password.`},async()=>(Ii(await N.staff.resetPassword(s.id),"reset"),"Password reset."))),a("dw-resend",()=>void gt({title:"Resend credentials?",confirmLabel:"Send new password",message:`A new temporary password is created and emailed to ${s.name}. The previous temporary password stops working.`},async()=>(Ii(await N.staff.resendCredentials(s.id),"resend"),"New credentials created."))),a("dw-logout",()=>void gt({title:"Sign out everywhere?",confirmLabel:"Force sign-out",danger:!0,message:`${s.name} is signed out of every device immediately. They can sign in again with their password.`},async()=>{const i=await N.staff.forceLogout(s.id);return`${i.message} (${i.revokedSessions} session${i.revokedSessions===1?"":"s"} ended)`})),a("dw-delete",()=>void gt({title:"Delete account?",confirmLabel:"Delete account",danger:!0,message:`${s.name} (${s.email}) is signed out now and can no longer sign in. You can restore the account later.`},async()=>(await N.staff.remove(s.id),`${s.name}'s account was deleted.`))),a("dw-restore",()=>void gt(null,async()=>(await N.staff.restore(s.id),`${s.name}'s account was restored (still disabled).`))),e.querySelectorAll("[data-end-session]").forEach(i=>i.addEventListener("click",()=>{const o=i.getAttribute("data-end-session");gt({title:"End this session?",confirmLabel:"End session",danger:!0,message:'That device can no longer refresh its sign-in. A screen already open stays usable until its access token expires (a few minutes); use "Force sign-out" to cut everything at once.'},async()=>(await N.staff.endSession(s.id,o),"Session ended."))}))}}async function Gt(){Ls.loading=!0,X==null||X.paintTable();try{const t={q:B.q.trim(),role:B.role,status:B.status,department:B.department.trim(),sort:B.sort,order:B.order,page:B.page,pageSize:B.pageSize};let e=await N.staff.search(t);e.items.length===0&&e.total>0&&B.page>e.pages&&(B.page=e.pages,e=await N.staff.search({...t,page:B.page})),Ls.data=e,Ls.error=""}catch(t){Ls.error=Ve(t)}finally{Ls.loading=!1,X==null||X.paintTable()}}async function pp(t){M.id=t,M.detail=null,M.sessions=null,M.history=null,M.error="",M.draft={},M.role="",await ao(t,!0)}async function ao(t,e){M.loading=!0,X==null||X.paintDrawer();const[s,a,n]=await Promise.allSettled([N.staff.detail(t),N.staff.sessions(t),N.audit.loginEvents({userId:t,pageSize:8})]);M.id===t&&(s.status==="fulfilled"?(M.detail=s.value,M.error="",e&&(M.draft={})):M.error=Ve(s.reason),M.sessions=a.status==="fulfilled"?a.value.items:[],M.history=n.status==="fulfilled"?n.value:null,M.loading=!1,X==null||X.paintDrawer())}function Xn(){M.id=null,M.detail=null,X==null||X.paintDrawer()}async function gt(t,e){if(M.busy||!M.id||t&&!await vd(t))return;const s=M.id;M.busy=!0,M.error="",X==null||X.paintDrawer();try{lt(await e(),"success"),M.draft={}}catch(a){M.error=Ve(a),lt(Ve(a),"error")}finally{M.busy=!1}await Promise.all([ao(s,!0),Gt()])}async function hp(t){const e={name:t.name,email:t.email,otpEmail:t.otpEmail,phone:t.phone||"",department:t.department||""},s={};if(Object.entries(M.draft).forEach(([n,i])=>{i.trim()!==e[n]&&(s[n]=i.trim())}),!Object.keys(s).length){lt("Nothing to save: no details were changed.","info",2500);return}if(s.name===""){M.error="The name must not be empty.",X==null||X.paintDrawer();return}const a="email"in s||"otpEmail"in s;await gt(a?{title:"Change sign-in email?",confirmLabel:"Save and sign out",danger:!0,message:`${t.name} is signed out everywhere, and their previous address is told about the change.`}:null,async()=>(await N.staff.updateProfile(t.id,s),"Details saved."))}function Ii(t,e){var n,i;const a=yd({title:e==="created"?"Account created":e==="reset"?"Password reset":"New credentials",body:`
      <div class="space-y-3 text-xs">
        <p class="text-slate-300"><b class="text-white">${x(t.user.name)}</b> (${x(t.user.role)}) — <span class="font-mono text-blue-400">${x(t.user.email)}</span></p>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="cr-pass">Temporary password</label>
          <div class="flex gap-2">
            <input id="cr-pass" readonly value="${x(t.temporaryPassword)}" class="glass-input flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 font-mono text-sm tracking-wider" />
            <button id="cr-copy" class="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold">Copy</button>
          </div>
        </div>
        <p class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
          This is the only time the password is shown. ${t.emailed?"It has also been emailed.":"No email was sent: give it to them yourself."}
          They must choose a new password when they sign in at <b>${x(op[t.user.role]||"/")}</b>.
        </p>
        <button id="cr-done" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider">DONE</button>
      </div>`});(n=a.root.querySelector("#cr-done"))==null||n.addEventListener("click",a.close),(i=a.root.querySelector("#cr-copy"))==null||i.addEventListener("click",async o=>{const r=o.currentTarget;await tp(t.temporaryPassword)?r.textContent="Copied ✓":(a.root.querySelector("#cr-pass").select(),r.textContent="Press Ctrl+C")})}function fp(t={},e=""){const s=(d,c="")=>x(t[d]??c),a="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white",n=yd({title:"Add staff member",body:`
      <p id="cs-error" class="text-xs font-semibold text-red-400 break-words ${e?"":"hidden"}">${x(e)}</p>
      <div class="space-y-3 text-xs">
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-name">Full name</label><input id="cs-name" class="${a}" value="${s("name")}" placeholder="Jane Doe" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-email">Work email (login id)</label><input id="cs-email" class="${a} font-mono" value="${s("email")}" placeholder="jane@company.com" /></div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-role">Role</label>
          <select id="cs-role" class="${a} font-semibold">${Li.map(d=>`<option value="${d.role}" ${(t.role||"Recruiter")===d.role?"selected":""}>${d.label}</option>`).join("")}</select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-dept">Department <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-dept" class="${a}" value="${s("department")}" /></div>
          <div><label class="block font-semibold text-slate-300 mb-1" for="cs-phone">Phone <span class="text-slate-500 font-normal">(optional)</span></label><input id="cs-phone" class="${a}" value="${s("phone")}" placeholder="+91 98765 43210" /></div>
        </div>
        <div><label class="block font-semibold text-slate-300 mb-1" for="cs-otp">2FA email <span class="text-slate-500 font-normal">(optional — defaults to the work email)</span></label><input id="cs-otp" class="${a} font-mono" value="${s("otpEmail")}" /></div>
        <p class="text-[11px] text-slate-500">A temporary password is generated and emailed. They must replace it when they first sign in.</p>
        <button id="cs-submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 disabled:opacity-60">CREATE ACCOUNT ➔</button>
      </div>`}),i=d=>n.root.querySelector(d),o=i("#cs-submit"),r=d=>{const c=i("#cs-error");c.textContent=d,c.classList.toggle("hidden",!d)},l=async()=>{const d={name:i("#cs-name").value.trim(),email:i("#cs-email").value.trim(),role:i("#cs-role").value,department:i("#cs-dept").value.trim(),phone:i("#cs-phone").value.trim(),otpEmail:i("#cs-otp").value.trim()};if(!d.name||!d.email)return r("Enter a name and an email.");r(""),o.disabled=!0;try{const c=await N.staff.create({name:d.name,email:d.email,role:d.role,...d.department?{department:d.department}:{},...d.phone?{phone:d.phone}:{},...d.otpEmail?{otpEmail:d.otpEmail}:{}});n.close(),lt(`${c.user.name} was added.`,"success"),Ii(c,"created"),Object.assign(B,{q:"",role:"",status:"all",department:"",sort:"createdAt",order:"desc",page:1}),X==null||X.mount()}catch(c){o.disabled=!1,r(Ve(c))}};o.addEventListener("click",()=>void l()),n.root.querySelectorAll("input").forEach(d=>d.addEventListener("keydown",c=>{c.key==="Enter"&&l()})),i("#cs-name").focus()}const ks=()=>({data:null,error:""}),ze={staff:ks(),security:ks(),activity:ks(),invites:ks(),health:ks(),policy:ks()},bp={staff:()=>N.dashboard.staff(),security:()=>N.dashboard.security(we.hours),activity:()=>N.dashboard.activity(8),invites:()=>N.dashboard.invites(),health:()=>N.dashboard.health(),policy:()=>N.settings.group("proctoring")},we={hours:24,probing:!1,probe:null,refreshedAt:0};let Zn;const mp={database:"Database",migrations:"Database schema",settings:"Platform settings",emailGateway:"Email gateway",encryption:"Secret encryption",securityPosture:"Security posture"},xp={healthy:{label:"Healthy",text:"text-emerald-400",tone:"green"},degraded:{label:"Needs attention",text:"text-amber-400",tone:"amber"},unhealthy:{label:"Unhealthy",text:"text-red-400",tone:"red"}},Er={ok:"bg-emerald-500",warning:"bg-amber-500",error:"bg-red-500"},rt=(t,e="")=>`<div class="glass-panel p-5 rounded-2xl border border-slate-800 ${e}">${t}</div>`,ft=(t,e="")=>`<div class="flex items-center justify-between gap-3 mb-3"><h3 class="text-sm font-bold text-white">${t}</h3>${e}</div>`,Nt=(t,e)=>`<p class="text-xs text-red-400">${x(e)}</p>
   <button data-retry="${t}" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`,$t=(t="Loading…")=>`<p class="text-xs text-slate-500 font-mono">${t}</p>`;function Ht(t,e,s,a="text-white"){return rt(`
    <span class="text-xs font-semibold text-slate-400 uppercase">${t}</span>
    <div class="text-2xl font-extrabold ${a} mt-1">${e}</div>
    <div class="text-[11px] text-slate-500 mt-1 space-y-1">${s}</div>`)}function Ar(t,e,s){if(t===0&&e===0)return"";const a=t-e;return a===0?'<span class="text-slate-500">same as before</span>':`<span class="${(s?a<0:a>0)?"text-emerald-400":"text-red-400"}">${a>0?"▲ +":"▼ −"}${Math.abs(a)} vs previous</span>`}class gp{constructor(e){this.root=e}mount(){var e;this.root.innerHTML=`
      <div class="space-y-6">
        <div class="flex items-center justify-between gap-3">
          <p id="ov-refreshed" class="text-[11px] text-slate-500"></p>
          <button id="ov-refresh" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">⟳ Refresh</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div id="ov-tile-health"></div><div id="ov-tile-staff"></div><div id="ov-tile-policy"></div><div id="ov-tile-email"></div>
        </div>
        <div id="ov-security"></div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div id="ov-activity"></div>
          <div id="ov-health-details"></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div id="ov-byrole"></div>
          <div id="ov-invites"></div>
        </div>
      </div>`,(e=this.root.querySelector("#ov-refresh"))==null||e.addEventListener("click",()=>this.loadAll(!0)),Object.keys(ze).forEach(s=>this.paint(s)),this.paintRefreshed(),this.loadAll(),window.clearInterval(Zn),Zn=window.setInterval(()=>{if(!this.root.isConnected)return void window.clearInterval(Zn);this.loadAll()},6e4)}loadAll(e=!1){const s=Object.keys(ze).map(a=>this.load(a));Promise.all(s).then(()=>{we.refreshedAt=Date.now(),this.paintRefreshed(),e&&lt("Dashboard refreshed.","success",2e3)},()=>{}).catch(()=>{})}async load(e){try{ze[e].data=await bp[e](),ze[e].error=""}catch(s){ze[e].error=Ve(s)}try{this.paint(e)}catch{}}paintRefreshed(){const e=this.root.querySelector("#ov-refreshed");e&&(e.textContent=we.refreshedAt?`Updated ${Ms(new Date(we.refreshedAt).toISOString())} • refreshes every minute`:"")}put(e,s){const a=this.root.querySelector(e);return!a||!a.isConnected?null:(a.innerHTML=s,a)}paint(e){switch(e){case"health":this.paintHealth();break;case"staff":this.paintStaff();break;case"policy":this.paintPolicy();break;case"security":this.paintSecurity();break;case"activity":this.paintActivity();break;case"invites":this.paintInvites();break}this.root.querySelectorAll("[data-retry]").forEach(s=>{s.onclick=()=>{this.load(s.getAttribute("data-retry")).catch(()=>{})}}),this.root.querySelectorAll("[data-goto]").forEach(s=>{s.onclick=()=>this.navigate(s.getAttribute("data-goto"))})}navigate(e){const[s,a]=e.split(":");s==="staff"&&a&&dp({status:a});const n=s==="settings"&&a?a:"";ye.navigate(Aa("admin",s,n))}paintHealth(){var d;const{data:e,error:s}=ze.health;if(!e){const c=s?Nt("health",s):$t();this.put("#ov-tile-health",Ht("System status",s?"Unknown":"…",c,"text-slate-400")),this.put("#ov-tile-email",Ht("Email gateway",s?"Unknown":"…",s?"":$t(),"text-slate-400")),this.put("#ov-health-details",rt(ft("Health checks")+(s?Nt("health",s):$t())));return}const a=xp[e.status];this.put("#ov-tile-health",Ht("System status",`<span class="inline-flex items-center gap-2"><span class="w-3 h-3 rounded-full ${Er[e.status==="healthy"?"ok":e.status==="degraded"?"warning":"error"]} ${e.status==="healthy"?"animate-pulse":""}"></span>${a.label}</span>`,`<p>${x(e.environment)} • up ${Xu(e.uptimeSeconds)} • v${x(e.version)}</p>`,a.text));const n=e.components.find(c=>c.name==="emailGateway"),i=(n==null?void 0:n.details)||{},o=(n==null?void 0:n.status)==="ok",r=we.probe;this.put("#ov-tile-email",Ht("Email gateway",o?"Configured":"Not configured",`<p>${x(i.host||"—")}:${x(i.port||"")} • password: ${x(i.passwordSource||"none")}</p>
       <p>${x(i.sender||"no sender address")}</p>
       <button id="ov-probe" ${we.probing?"disabled":""} class="mt-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-60">${we.probing?"Checking…":"🔌 Check connection"}</button>
       ${r?`<p class="${r.ok?"text-emerald-400":"text-red-400"} font-semibold break-words">${r.ok?"✓":"✗"} ${x(r.message)}</p>`:""}
       <button type="button" data-goto="settings:email" class="text-blue-400 hover:text-blue-300 font-semibold">Email settings →</button>`,o?"text-purple-400":"text-amber-400")),(d=this.root.querySelector("#ov-probe"))==null||d.addEventListener("click",()=>{this.probeEmail().catch(()=>{})});const l=e.components.map(c=>`
      <li class="py-2.5 border-b border-slate-800/60 last:border-0">
        <div class="flex items-start gap-2.5">
          <span class="mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${Er[c.status]}"></span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-bold text-white">${x(mp[c.name]||c.name)}</p>
            <p class="text-[11px] text-slate-400 break-words">${x(c.message)}</p>
            ${(c.details.findings||[]).length?`<ul class="mt-1.5 space-y-1">${c.details.findings.map(u=>`<li class="text-[11px] text-amber-300/90 pl-3 relative before:content-['•'] before:absolute before:left-0">${x(u.message)}</li>`).join("")}</ul>`:""}
          </div>
          ${_e(c.status==="ok"?"OK":c.status==="warning"?"Check":"Problem",c.status==="ok"?"green":c.status==="warning"?"amber":"red")}
        </div>
      </li>`).join("");this.put("#ov-health-details",rt(ft("Health checks",_e(a.label,a.tone))+`<ul>${l}</ul>`))}async probeEmail(){if(!we.probing){we.probing=!0;try{this.paintHealth(),we.probe=await N.dashboard.probeEmail(),lt(we.probe.ok?"Email gateway connected.":we.probe.message,we.probe.ok?"success":"error")}catch(e){we.probe=null,lt(Ve(e),"error")}finally{we.probing=!1;try{this.paintHealth()}catch{}}}}paintStaff(){const{data:e,error:s}=ze.staff;if(!e){this.put("#ov-tile-staff",Ht("Staff accounts",s?"Unavailable":"…",s?Nt("staff",s):$t(),"text-slate-400")),this.put("#ov-byrole",rt(ft("Staff by role")+(s?Nt("staff",s):$t())));return}const a=(i,o,r)=>i>0?`<button data-goto="staff:${r}" class="text-blue-400 hover:text-blue-300 font-semibold">${i} ${o}</button>`:`<span>${i} ${o}</span>`;this.put("#ov-tile-staff",Ht("Staff accounts",`${e.active} active`,`<p>${a(e.lockedNow,"locked","locked")} • ${a(e.pendingPasswordChange,"awaiting first password","pendingPassword")}</p>
       <p>${a(e.neverSignedIn,"never signed in","neverSignedIn")} • ${e.signedInLast24h} signed in today</p>`));const n=Math.max(1,...e.byRole.map(i=>i.active+i.disabled));this.put("#ov-byrole",rt(ft("Staff by role",'<button data-goto="staff" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">Manage →</button>')+`<div class="space-y-3">${e.byRole.map(i=>`
        <div>
          <div class="flex justify-between text-[11px] mb-1"><span class="font-bold text-slate-200">${x(i.role)}</span>
            <span class="text-slate-400">${i.active} active${i.disabled?` • ${i.disabled} disabled`:""}</span></div>
          <div class="h-2 rounded-full bg-slate-800 overflow-hidden flex">
            <div class="bg-blue-500" style="width:${i.active/n*100}%"></div>
            <div class="bg-slate-600" style="width:${i.disabled/n*100}%"></div>
          </div>
        </div>`).join("")}</div>
        <p class="text-[11px] text-slate-500 mt-3">${e.createdLast7d} created in the last 7 days • ${e.signedInLast7d} signed in this week</p>`))}paintPolicy(){const{data:e,error:s}=ze.policy;if(!e){this.put("#ov-tile-policy",Ht("Proctoring policy",s?"Unavailable":"…",s?Nt("policy",s):$t(),"text-slate-400"));return}this.put("#ov-tile-policy",Ht("Proctoring policy",`${x(e.maxViolationsBeforeTerminate)} violations max`,`<p>${x(e.maxTabSwitches)} tab-switch warnings before action</p>
       <p>AI sensitivity: ${x(e.proctoringSensitivity)}</p>
       <button type="button" data-goto="settings:proctoring" class="text-blue-400 hover:text-blue-300 font-semibold">Edit policy →</button>`,"text-blue-400"))}paintSecurity(){const{data:e,error:s}=ze.security,a=`<select id="ov-hours" class="glass-input px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 text-white text-[11px] font-semibold">
      ${[[24,"Last 24 hours"],[72,"Last 3 days"],[168,"Last 7 days"]].map(([l,d])=>`<option value="${l}" ${l===we.hours?"selected":""}>${d}</option>`).join("")}</select>`;if(!e){this.put("#ov-security",rt(ft("Sign-in security",a)+(s?Nt("security",s):$t()))),this.bindHours();return}const n=e.totals,i=(l,d,c="",u="text-white")=>`
      <div class="rounded-xl bg-slate-900 border border-slate-800 p-3">
        <p class="text-[10px] font-bold uppercase text-slate-500">${l}</p>
        <p class="text-xl font-extrabold ${u}">${d}</p><p class="text-[10px] mt-0.5">${c||"&nbsp;"}</p>
      </div>`,o=(l,d)=>`
      <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">${l}</p>
        ${d.length?`<ul class="space-y-1">${d.map(c=>`<li class="flex justify-between gap-3 text-[11px]"><span class="font-mono text-slate-300 truncate">${x(c.value)}</span><span class="text-red-400 font-bold">${c.count}</span></li>`).join("")}</ul>`:'<p class="text-[11px] text-slate-500">None</p>'}</div>`,r=e.series.map(l=>({label:Yu(l.start,e.bucket),ok:l.successful,bad:l.failed}));this.put("#ov-security",rt(`
      ${ft("Sign-in security",a)}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${i("Successful sign-ins",n.successfulSignIns,Ar(n.successfulSignIns,e.previousPeriod.successfulSignIns,!1),"text-emerald-400")}
        ${i("Failed sign-ins",n.failedSignIns,Ar(n.failedSignIns,e.previousPeriod.failedSignIns,!0),n.failedSignIns?"text-red-400":"text-white")}
        ${i("Lockouts",n.lockouts,`${e.lockedAccountsNow} locked right now`,n.lockouts?"text-amber-400":"text-white")}
        ${i("Rate-limited",n.rateLimited,"blocked for too many requests",n.rateLimited?"text-amber-400":"text-white")}
        ${i("Wrong passcodes",n.otpFailures)}
        ${i("Blocked while locked",n.blockedAttempts)}
        ${i("People signed in",n.uniqueUsers)}
        ${i("Token-theft alerts",n.tokenReuseAlerts,n.tokenReuseAlerts?"investigate in Audit Logs":"",n.tokenReuseAlerts?"text-red-400":"text-white")}
      </div>
      <div class="mt-4">${Zu(r)}
        <div class="flex gap-4 text-[10px] text-slate-400 mt-1"><span><span class="inline-block w-2 h-2 rounded-sm bg-emerald-500"></span> successful</span><span><span class="inline-block w-2 h-2 rounded-sm bg-red-500"></span> failed / blocked</span>
          <span>per ${e.bucket} (UTC)</span></div></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-4 border-t border-slate-800">
        ${o("Top failing emails",e.topFailingEmails)}
        ${o("Top failing IP addresses",e.topFailingIps)}
        <div><p class="text-[10px] font-bold uppercase text-slate-500 mb-1.5">Why sign-ins failed</p>
          ${e.failuresByReason.length?`<div class="flex flex-wrap gap-1.5">${e.failuresByReason.map(l=>`<span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">${x(l.reason.replace(/_/g," "))} <b class="text-red-400">${l.count}</b></span>`).join("")}</div>`:'<p class="text-[11px] text-slate-500">None</p>'}</div>
      </div>
      ${e.truncated?'<p class="text-[10px] text-amber-400 mt-3">Very high volume: only the latest events were counted.</p>':""}`)),this.bindHours()}bindHours(){var e;(e=this.root.querySelector("#ov-hours"))==null||e.addEventListener("change",s=>{we.hours=Number(s.currentTarget.value),ze.security.data=null,this.paintSecurity(),this.load("security").catch(()=>{})})}paintActivity(){const{data:e,error:s}=ze.activity,a='<button data-goto="audit" class="text-[11px] font-semibold text-blue-400 hover:text-blue-300">View all →</button>';if(!e){this.put("#ov-activity",rt(ft("Recent activity",a)+(s?Nt("activity",s):$t())));return}const n={auth:"blue",staff:"purple",security:"red",settings:"amber",system:"slate",candidate:"green"};this.put("#ov-activity",rt(ft("Recent activity",a)+(e.items.length?`<ul>${e.items.map(i=>`
        <li class="py-2.5 border-b border-slate-800/60 last:border-0 flex items-start gap-2.5">
          <span class="mt-0.5">${i.success?"":"⚠️"}</span>
          <div class="min-w-0 flex-1">
            <p class="text-xs text-slate-200 break-words">${x(i.summary)}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">${Ms(i.createdAt)}${i.actorEmail?` • ${x(i.actorEmail)}`:""}</p>
          </div>${_e(i.category,n[i.category]||"slate")}
        </li>`).join("")}</ul>`:'<p class="text-xs text-slate-500">Nothing has happened yet.</p>')))}paintInvites(){const{data:e,error:s}=ze.invites;if(!e){this.put("#ov-invites",rt(ft("Candidate invitations")+(s?Nt("invites",s):$t())));return}const a=(n,i,o="text-white")=>`<div class="rounded-xl bg-slate-900 border border-slate-800 p-3"><p class="text-[10px] font-bold uppercase text-slate-500">${n}</p><p class="text-xl font-extrabold ${o}">${i}</p></div>`;this.put("#ov-invites",rt(ft("Candidate invitations")+`
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${a("Total sent",e.total)}${a("Active",e.active,"text-blue-400")}${a("Waiting for candidate",e.awaitingCandidate,"text-amber-400")}
        ${a("Verified",e.verified,"text-emerald-400")}${a("Expired",e.expired)}${a("Expiring in 24 h",e.expiringWithin24h,e.expiringWithin24h?"text-amber-400":"text-white")}
      </div>
      <p class="text-[11px] text-slate-500 mt-3">${e.createdLast7d} sent in the last 7 days • ${e.revoked} revoked</p>`))}}const E={schema:null,values:{},drafts:{},fieldErrors:{},groupErrors:{},savedAt:{},saving:{},loadError:"",loading:!1,email:{busy:"",to:"",result:null}},vp=/^[^@\s<>"',;]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/,yp=/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/,wp=/[\u0000-\u001f\u007f<>"]/,ln=new Set(["smtpHost","smtpPort"]),Sp={database:"A password is saved in the platform (encrypted).",environment:"Using the password from the server's .env file. Saving one here replaces it.",none:"No password is configured: emails cannot be sent."};let be=null;const $d=(t,e)=>{var s;return(s=E.values[t])==null?void 0:s[e]},kp=(t,e)=>e in(E.drafts[t]||{})?E.drafts[t][e]:$d(t,e);function Ya(t){var a,n;const e=E.drafts[t]||{};return(((n=(a=E.schema)==null?void 0:a.find(i=>i.group===t))==null?void 0:n.fields)||[]).filter(i=>ln.has(i.key)||!(i.key in e)?!1:i.secret?String(e[i.key]).length>0:e[i.key]!==$d(t,i.key)).map(i=>i.key)}function $p(t,e){var a;if(t.type==="bool")return{value:!!e};if(t.type==="enum")return(a=t.choices)!=null&&a.includes(String(e))?{value:String(e)}:{error:"Choose one of the listed options."};if(t.type==="int"){const n=typeof e=="number"?e:Number(String(e).trim());return String(e).trim()===""||!Number.isInteger(n)?{error:"Enter a whole number."}:t.min!=null&&n<t.min?{error:`Must be at least ${t.min}.`}:t.max!=null&&n>t.max?{error:`Must be at most ${t.max}.`}:{value:n}}const s=t.secret?String(e??""):String(e??"").trim();return s?s.length>t.maxLength?{error:`At most ${t.maxLength} characters.`}:t.fmt==="email"&&!vp.test(s)?{error:"Enter a valid email address."}:t.fmt==="hostname"&&!yp.test(s)?{error:"Enter a host name such as smtp.gmail.com."}:t.fmt==="text"&&wp.test(s)?{error:'Remove special characters such as < > ".'}:{value:s}:t.allowEmpty?{value:""}:{error:"This cannot be empty."}}class Ep{constructor(e){this.root=e}mount(){be=this,this.paint(),Tr()}paint(){var s,a;if(!this.root.isConnected)return;const e=window.scrollY;if(!E.schema){this.root.innerHTML=`<div class="glass-panel p-6 rounded-3xl border border-slate-800">${E.loadError?`<p class="text-xs text-red-400">${x(E.loadError)}</p><button id="se-retry" class="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px]">Try again</button>`:'<p class="text-xs text-slate-500 font-mono">Loading settings…</p>'}</div>`,(s=this.root.querySelector("#se-retry"))==null||s.addEventListener("click",()=>void Tr());return}this.root.innerHTML=`
      <div class="space-y-6">
        <div class="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Global Policy & System Settings</h2>
            <p class="text-xs text-slate-400 mt-0.5">Each section saves on its own and applies immediately. Every change is recorded in the audit log.</p>
          </div>
          <button id="se-history" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs whitespace-nowrap">📜 Settings history</button>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          ${E.schema.map(n=>`<div id="set-card-${n.group}" class="scroll-mt-24 ${n.group==="email"?"xl:col-span-2":""}">${this.cardHtml(n)}</div>`).join("")}
        </div>
      </div>`,(a=this.root.querySelector("#se-history"))==null||a.addEventListener("click",()=>{ap({category:"settings"}),ye.navigate(Aa("admin","audit"))}),E.schema.forEach(n=>this.bindCard(n)),window.location.hash?this.focusHash():window.scrollTo({top:e})}focusHash(){const e=window.location.hash.replace(/^#/,"");if(!e)return;const s=this.root.querySelector(`#set-card-${e}`)||this.root.querySelector(`#${e}`);s&&requestAnimationFrame(()=>{s.scrollIntoView({behavior:"smooth",block:"start"}),s.classList.add("ring-2","ring-blue-500/50"),window.setTimeout(()=>s.classList.remove("ring-2","ring-blue-500/50"),1800)})}paintCard(e){var n;const s=(n=E.schema)==null?void 0:n.find(i=>i.group===e),a=this.root.querySelector(`#set-card-${e}`);!s||!a||!a.isConnected||(a.innerHTML=this.cardHtml(s),this.bindCard(s))}cardHtml(e){const s=Ya(e.group).length,a=!!E.saving[e.group],n=e.fields.map(o=>this.fieldHtml(e.group,o)).join(""),i=e.fields.filter(o=>o.type==="bool").length>=3;return`
      <form data-group="${e.group}" novalidate class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 h-full">
        <div class="border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white">${x(e.title)}</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">${x(e.description)}</p>
        </div>
        <div class="${i||e.group==="email"?"grid grid-cols-1 md:grid-cols-2 gap-x-5":""} gap-y-4 space-y-4 md:space-y-0 text-xs">${n}</div>
        ${e.group==="email"?this.emailExtrasHtml():""}
        ${E.groupErrors[e.group]?`<p class="text-xs font-semibold text-red-400 break-words" role="alert">${x(E.groupErrors[e.group])}</p>`:""}
        <div class="flex items-center justify-end gap-3 pt-1">
          <span data-status class="mr-auto text-[11px] ${s?"text-amber-400":"text-slate-500"}">${s?`${s} unsaved change${s===1?"":"s"}`:E.savedAt[e.group]?`Saved ${x(Ue(E.savedAt[e.group]))}`:""}</span>
          <button type="button" data-discard ${s&&!a?"":"disabled"} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs disabled:opacity-40">Discard</button>
          <button type="submit" data-save ${s&&!a?"":"disabled"} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider shadow-md disabled:opacity-40">${a?"SAVING…":"SAVE"}</button>
        </div>
      </form>`}fieldHtml(e,s){var h,p;const a=`set-${e}-${s.key}`,n=kp(e,s.key),i=(h=E.fieldErrors[e])==null?void 0:h[s.key],o=ln.has(s.key),r=s.type==="int"&&s.min!=null&&s.max!=null?` (${s.min}–${s.max})`:"",l=`<p data-error="${s.key}" class="text-[10px] text-red-400 mt-1 ${i?"":"hidden"}">${x(i||"")}</p>`,d=`glass-input w-full px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white${o?" opacity-70 cursor-not-allowed":""}`,c=o?' readonly disabled tabindex="-1"':"";if(s.type==="bool")return`
        <label class="flex items-start justify-between gap-4 cursor-pointer py-1" for="${a}">
          <span><span class="block font-semibold text-slate-300">${x(s.label)}</span><span class="block text-[10px] text-slate-500">${x(s.description)}</span></span>
          <input id="${a}" data-key="${s.key}" type="checkbox" ${n?"checked":""} class="mt-1 w-4 h-4 shrink-0 text-blue-600 bg-slate-950 border-slate-700 rounded" />
        </label>`;let u;if(s.type==="enum")u=`<select id="${a}" data-key="${s.key}" class="${d} font-semibold">${(s.choices||[]).map(f=>`<option value="${x(f)}" ${String(n)===f?"selected":""}>${x(f)}</option>`).join("")}</select>`;else if(s.type==="int")u=`<input id="${a}" data-key="${s.key}" type="number" step="1" ${s.min!=null?`min="${s.min}"`:""} ${s.max!=null?`max="${s.max}"`:""} value="${x(n??"")}" class="${d}"${c} />`;else if(s.secret){const f=(p=E.values.email)==null?void 0:p.smtpPasswordSet;u=`<input id="${a}" data-key="${s.key}" type="password" autocomplete="new-password" value="${x(n??"")}" placeholder="${f?"•••••••• (leave empty to keep the current password)":"16-character app password"}" class="${d} font-mono" />`}else u=`<input id="${a}" data-key="${s.key}" type="${s.fmt==="email"?"email":"text"}" maxlength="${s.maxLength}" value="${x(n??"")}" class="${d} ${s.fmt?"font-mono":""}"${c} />`;return`
      <div>
        <label class="block font-semibold text-slate-300 mb-1" for="${a}">${x(s.label)}</label>
        ${u}
        <p class="text-[10px] text-slate-500 mt-1">${x(s.description)}${r}${o?" Locked — this cannot be changed here.":""}</p>
        ${l}
      </div>`}emailExtrasHtml(){const s=(E.values.email||{}).smtpPasswordSource||"none",a=E.email.busy,n=Ya("email").length>0,i=E.email.result;return`
      <div class="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 text-xs">
        <div class="flex flex-wrap items-center gap-2">
          ${_e(s==="none"?"No password":s==="database"?"Password saved":"Password from .env",s==="none"?"amber":"green")}
          <span class="text-slate-400">${Sp[s]}</span>
        </div>
        ${n?'<p class="text-[11px] text-amber-400">Save your email changes first: the checks below use the saved settings.</p>':""}
        <div class="flex flex-wrap items-end gap-2">
          <button type="button" data-email="probe" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-[11px] disabled:opacity-50">${a==="probe"?"Checking…":"🔌 Check connection"}</button>
          <div class="flex items-end gap-2">
            <input id="se-test-to" type="email" value="${x(E.email.to)}" placeholder="Send to (default: your 2FA email)" class="glass-input px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-[11px] w-56" />
            <button type="button" data-email="test" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-300 font-bold text-[11px] disabled:opacity-50">${a==="test"?"Sending…":"✉ Send test email"}</button>
          </div>
          ${s==="database"?`<button type="button" data-email="clear" ${a?"disabled":""} class="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 font-bold text-[11px] disabled:opacity-50">Remove saved password</button>`:""}
        </div>
        ${i?`<p class="${i.ok?"text-emerald-400":"text-red-400"} font-semibold break-words" role="status">${i.ok?"✓":"✗"} ${x(i.text)}</p>`:""}
      </div>`}bindCard(e){var n;const s=this.root.querySelector(`form[data-group="${e.group}"]`);if(!s)return;const a=i=>e.fields.find(o=>o.key===i);if(s.querySelectorAll("[data-key]").forEach(i=>{const o=i.getAttribute("data-key");if(ln.has(o)||i.disabled)return;const r=()=>{var c,u,h;const l=a(o),d=l.type==="bool"?i.checked:l.type==="int"?i.value===""?"":Number(i.value):i.value;((c=E.drafts)[u=e.group]||(c[u]={}))[o]=d,E.fieldErrors[e.group]&&delete E.fieldErrors[e.group][o],(h=s.querySelector(`[data-error="${o}"]`))==null||h.classList.add("hidden"),E.groupErrors[e.group]="",this.refreshFooter(e.group,s)};i.addEventListener(i instanceof HTMLSelectElement||i.type==="checkbox"?"change":"input",r)}),s.addEventListener("submit",i=>{i.preventDefault(),Ap(e)}),(n=s.querySelector("[data-discard]"))==null||n.addEventListener("click",()=>{E.drafts[e.group]={},E.fieldErrors[e.group]={},E.groupErrors[e.group]="",this.paintCard(e.group)}),e.group==="email"){const i=s.querySelector("#se-test-to");i==null||i.addEventListener("input",o=>{E.email.to=o.target.value}),i==null||i.addEventListener("keydown",o=>{o.key==="Enter"&&(o.preventDefault(),Cr("test"))}),s.querySelectorAll("[data-email]").forEach(o=>o.addEventListener("click",()=>void Cr(o.getAttribute("data-email"))))}}refreshFooter(e,s){const a=Ya(e).length;s.querySelectorAll("[data-save],[data-discard]").forEach(i=>{i.disabled=a===0||!!E.saving[e]});const n=s.querySelector("[data-status]");n&&(n.textContent=a?`${a} unsaved change${a===1?"":"s"}`:E.savedAt[e]?`Saved ${Ue(E.savedAt[e])}`:"",n.className=`mr-auto text-[11px] ${a?"text-amber-400":"text-slate-500"}`)}paintGroup(e){this.paintCard(e)}}async function Tr(){E.loading=!0;try{const[t,e]=await Promise.all([N.settings.schema(),N.settings.all()]);E.schema=t.groups,E.values=e,E.loadError=""}catch(t){E.loadError=Ve(t)}finally{E.loading=!1,be==null||be.paint()}}async function Ap(t){const e=Ya(t.group);if(!e.length||E.saving[t.group])return;const s={},a={};if(e.forEach(n=>{if(ln.has(n))return;const i=t.fields.find(r=>r.key===n),o=$p(i,E.drafts[t.group][n]);o.error?a[n]=o.error:s[n]=o.value}),E.fieldErrors[t.group]=a,Object.keys(a).length){E.groupErrors[t.group]="Fix the highlighted fields first.",be==null||be.paintGroup(t.group);return}E.saving[t.group]=!0,E.groupErrors[t.group]="",be==null||be.paintGroup(t.group);try{E.values[t.group]=await N.settings.update(t.group,s),E.drafts[t.group]={},E.savedAt[t.group]=new Date().toISOString(),lt(`${t.title} saved. It applies immediately.`,"success"),(t.group==="proctoring"||t.group==="assessment")&&y.loadPolicy("staff")}catch(n){E.groupErrors[t.group]=Ve(n)}finally{E.saving[t.group]=!1,be==null||be.paintGroup(t.group)}}async function Cr(t){if(!E.email.busy&&!(t==="clear"&&!await vd({title:"Remove the saved password?",confirmLabel:"Remove",danger:!0,message:"The platform will fall back to the password in the server's .env file (if there is one). Emails stop if there is none."}))){E.email.busy=t,E.email.result=null,be==null||be.paintGroup("email");try{if(t==="probe"){const e=await N.dashboard.probeEmail();E.email.result={ok:e.ok,text:e.message}}else if(t==="test"){const e=await N.settings.testEmail(E.email.to.trim()||void 0);E.email.result={ok:e.ok,text:e.ok?`Test email sent to ${e.sentTo} through ${e.host}:${e.port}.`:e.message}}else E.values.email=await N.settings.clearEmailPassword(),E.email.result={ok:!0,text:"The saved password was removed."},lt("Saved password removed.","success")}catch(e){E.email.result={ok:!1,text:Ve(e)}}finally{E.email.busy="",be==null||be.paintGroup("email")}}}const Lr={overview:{icon:"📊",title:"Dashboard & Health",blurb:"How the platform is doing right now: accounts, sign-in security, activity and system health."},staff:{icon:"👥",title:"Staff Management",blurb:"Who can sign in, with which role, and what they can do."},settings:{icon:"⚙️",title:"Global System Settings",blurb:"Proctoring rules, assessment defaults, security policy and the email gateway."},audit:{icon:"📜",title:"Audit Logs",blurb:"Every sign-in and administrative action, with who did it and from where."}};class Tp{constructor(e){b(this,"container");this.container=e}get activeTab(){const e=Fs("admin");return e in Lr?e:"overview"}render(){const e=this.activeTab,s=Lr[e];this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel border-slate-800">
          <div class="space-y-1">
            <h1 class="text-xl font-extrabold flex items-center gap-2.5">
              <span class="text-2xl">${s.icon}</span>
              <span>${s.title}</span>
            </h1>
            <p class="text-xs text-slate-400 max-w-2xl">${s.blurb}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Admin Console
            </span>
            <span class="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Healthy
            </span>
          </div>
        </div>
        <div id="admin-tab-content"></div>
      </div>`;const a=this.container.querySelector("#admin-tab-content");switch(e){case"overview":new gp(a).mount();break;case"staff":new up(a).mount();break;case"settings":new Ep(a).mount();break;case"audit":new np(a).mount();break}}}const Ir=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function Cp(t){return`${L.apiBase.replace(/^http/,"ws")}/ws/proctoring?token=${encodeURIComponent(t)}`}class Lp{constructor(){b(this,"root",null);b(this,"ws",null);b(this,"open",!1);b(this,"messages",[]);b(this,"speaking",!1);b(this,"poll",null);b(this,"audioCtx",null);b(this,"playAt",0);b(this,"publishTimer",null);b(this,"micBound",null);b(this,"micStop",null)}mount(){document.getElementById("candidate-assist")||(this.root=document.createElement("div"),this.root.id="candidate-assist",document.body.appendChild(this.root),this.paint()),this.connect(),this.watchGate()}hide(){var e;(e=this.root)==null||e.remove(),this.root=null}connect(){const e=L.getCandidateToken();!e||this.ws&&this.ws.readyState<=WebSocket.OPEN||(this.ws=new WebSocket(Cp(e)),this.ws.onopen=()=>this.startPublisher(),this.ws.onmessage=s=>{const a=JSON.parse(s.data);a.type==="history"&&Array.isArray(a.messages)?(this.messages=a.messages.map(n=>({from:n.from,text:n.text,at:n.at})),this.paint()):a.type==="chat"&&a.from==="proctor"?(this.messages.push({from:"proctor",text:a.text,at:a.at}),this.open=!0,this.speaking=!1,this.paint()):a.type==="audio"&&typeof a.pcm=="string"&&(this.speaking=!0,this.paint(),this.playPcm(a.pcm),window.setTimeout(()=>{this.speaking=!1,this.paint()},600))},this.ws.onclose=()=>{this.ws=null})}watchGate(){this.poll||(this.poll=window.setInterval(()=>{const e=y.getState();!e.otpVerified||e.examStarted||e.examCompleted||e.candidateFeedback||!e.systemCheckCompleted||!e.activeCandidateId||L.fetchJson("/candidate/gate","GET",void 0,"candidate").then(async s=>{const a=y.getState();if(!s.admitted||a.examStarted||a.examCompleted||a.candidateFeedback||!e.activeCandidateId)return;y.approveCandidateIdentity(e.activeCandidateId);const{requestExamFullscreen:n}=await $i(async()=>{const{requestExamFullscreen:i}=await Promise.resolve().then(()=>fh);return{requestExamFullscreen:i}},void 0);n()}).catch(()=>{})},2e3))}playPcm(e){const s=window.AudioContext||window.webkitAudioContext;if(!s)return;this.audioCtx||(this.audioCtx=new s({sampleRate:16e3}));const a=this.audioCtx;a.resume().catch(()=>{});const n=Uint8Array.from(atob(e),c=>c.charCodeAt(0)),i=new Int16Array(n.buffer,n.byteOffset,Math.floor(n.byteLength/2)),o=a.createBuffer(1,i.length,16e3),r=o.getChannelData(0);for(let c=0;c<i.length;c++)r[c]=i[c]/32768;const l=a.createBufferSource();l.buffer=o,l.connect(a.destination);const d=a.currentTime;this.playAt<d&&(this.playAt=d+.02),l.start(this.playAt),this.playAt+=o.duration}reportFinished(){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({type:"finished"}))}reportViolation(e,s="medium"){!this.ws||this.ws.readyState!==WebSocket.OPEN||this.ws.send(JSON.stringify({event:e,severity:s,timestamp:new Date().toISOString()}))}sendSnapshot(e,s){!this.ws||this.ws.readyState!==WebSocket.OPEN||!e.startsWith("data:image/jpeg")||e.length>4e5||this.ws.send(JSON.stringify({type:"snapshot",image:e,reason:s}))}startPublisher(){if(this.publishTimer)return;const e=document.createElement("canvas");e.width=320,e.height=180;const s=e.getContext("2d");this.publishTimer=window.setInterval(()=>{if(!this.ws||this.ws.readyState!==WebSocket.OPEN||!s)return;const a=["#proctor-pip-video","#stay-on-video","#wait-cam","#id-webcam"].map(o=>document.querySelector(o)).find(o=>o&&o.videoWidth>0&&!o.classList.contains("hidden"));if(!a)return;s.drawImage(a,0,0,e.width,e.height);const n=e.toDataURL("image/jpeg",.45);n.length<14e4&&this.ws.send(JSON.stringify({type:"frame",image:n}));const i=a.srcObject;i&&this.bindMic(i)},800)}bindMic(e){var r;if(this.micBound===e||!e.getAudioTracks().length)return;(r=this.micStop)==null||r.call(this);const s=window.AudioContext||window.webkitAudioContext;if(!s)return;const a=new s({sampleRate:16e3}),n=a.createMediaStreamSource(e),i=a.createScriptProcessor(2048,1,1),o=a.createGain();o.gain.value=0,i.onaudioprocess=l=>{if(!this.ws||this.ws.readyState!==WebSocket.OPEN)return;const d=l.inputBuffer.getChannelData(0),c=new Int16Array(d.length);for(let p=0;p<d.length;p++){const f=Math.max(-1,Math.min(1,d[p]));c[p]=f<0?f*32768:f*32767}const u=new Uint8Array(c.buffer);let h="";for(let p=0;p<u.length;p++)h+=String.fromCharCode(u[p]);this.ws.send(JSON.stringify({type:"mic",pcm:btoa(h)}))},n.connect(i),i.connect(o),o.connect(a.destination),this.micBound=e,this.micStop=()=>{i.disconnect(),n.disconnect(),a.close().catch(()=>{}),this.micBound=null}}send(e){!this.ws||this.ws.readyState!==WebSocket.OPEN||(this.ws.send(JSON.stringify({type:"chat",text:e})),this.messages.push({from:"candidate",text:e,at:new Date().toISOString()}),this.paint(""))}paint(e){var a,n,i;if(!this.root)return;e===void 0&&(e=((a=this.root.querySelector("#cand-chat-input"))==null?void 0:a.value)||""),this.root.innerHTML=`
      <button id="cand-chat-toggle" class="fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xl shadow-lg shadow-blue-600/30" title="Chat with the proctor">💬</button>
      ${this.speaking?'<div class="fixed bottom-20 left-4 z-40 px-3 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">Proctor is speaking</div>':""}
      ${this.open?`
        <div class="fixed bottom-20 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] glass-panel rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl flex flex-col overflow-hidden">
          <div class="px-3 py-2 border-b border-slate-800 text-xs font-bold text-white">Proctor chat</div>
          <div id="cand-chat-log" class="h-56 overflow-y-auto p-3 space-y-2 text-xs">
            ${this.messages.map(o=>`
              <div class="${o.from==="candidate"?"text-right":"text-left"}">
                <span class="inline-block px-2.5 py-1.5 rounded-xl ${o.from==="candidate"?"bg-blue-600 text-white":"bg-slate-800 text-slate-100"}">${Ir(o.text)}</span>
              </div>
            `).join("")||'<p class="text-slate-500">Message the proctor if you need help.</p>'}
          </div>
          <form id="cand-chat-form" class="flex gap-2 p-2 border-t border-slate-800">
            <input id="cand-chat-input" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Write a message" value="${Ir(e)}" />
            <button class="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold" type="submit">Send</button>
          </form>
        </div>
      `:""}
    `,(n=this.root.querySelector("#cand-chat-toggle"))==null||n.addEventListener("click",()=>{var o;this.open=!this.open,(o=this.audioCtx)==null||o.resume().catch(()=>{}),this.paint()}),(i=this.root.querySelector("#cand-chat-form"))==null||i.addEventListener("submit",o=>{var d;o.preventDefault();const r=(d=this.root)==null?void 0:d.querySelector("#cand-chat-input"),l=(r==null?void 0:r.value.trim())||"";l&&this.send(l)});const s=this.root.querySelector("#cand-chat-log");s&&(s.scrollTop=s.scrollHeight)}}const ba=new Lp,Mr=Object.freeze(Object.defineProperty({__proto__:null,candidateAssist:ba},Symbol.toStringTag,{value:"Module"}));var xs=typeof self<"u"?self:{};function as(){throw Error("Invalid UTF8")}function _r(t,e){return e=String.fromCharCode.apply(null,e),t==null?e:t+e}let Oa,ei;const Ip=typeof TextDecoder<"u";let Mp;const _p=typeof TextEncoder<"u";function Ed(t){if(_p)t=(Mp||(Mp=new TextEncoder)).encode(t);else{let s=0;const a=new Uint8Array(3*t.length);for(let n=0;n<t.length;n++){var e=t.charCodeAt(n);if(e<128)a[s++]=e;else{if(e<2048)a[s++]=e>>6|192;else{if(e>=55296&&e<=57343){if(e<=56319&&n<t.length){const i=t.charCodeAt(++n);if(i>=56320&&i<=57343){e=1024*(e-55296)+i-56320+65536,a[s++]=e>>18|240,a[s++]=e>>12&63|128,a[s++]=e>>6&63|128,a[s++]=63&e|128;continue}n--}e=65533}a[s++]=e>>12|224,a[s++]=e>>6&63|128}a[s++]=63&e|128}}t=s===a.length?a:a.subarray(0,s)}return t}var no,dn;e:{for(var jr=["CLOSURE_FLAGS"],ti=xs,si=0;si<jr.length;si++)if((ti=ti[jr[si]])==null){dn=null;break e}dn=ti}var wa,Pr=dn&&dn[610401301];no=Pr!=null&&Pr;const Dr=xs.navigator;function Mi(t){return!!no&&!!wa&&wa.brands.some(({brand:e})=>e&&e.indexOf(t)!=-1)}function et(t){var e;return(e=xs.navigator)&&(e=e.userAgent)||(e=""),e.indexOf(t)!=-1}function Jt(){return!!no&&!!wa&&wa.brands.length>0}function ai(){return Jt()?Mi("Chromium"):(et("Chrome")||et("CriOS"))&&!(!Jt()&&et("Edge"))||et("Silk")}function io(t){return io[" "](t),t}wa=Dr&&Dr.userAgentData||null,io[" "]=function(){};var jp=!Jt()&&(et("Trident")||et("MSIE"));!et("Android")||ai(),ai(),et("Safari")&&(ai()||!Jt()&&et("Coast")||!Jt()&&et("Opera")||!Jt()&&et("Edge")||(Jt()?Mi("Microsoft Edge"):et("Edg/"))||Jt()&&Mi("Opera"));var Ad={},ua=null;function Pp(t){const e=t.length;let s=3*e/4;s%3?s=Math.floor(s):"=.".indexOf(t[e-1])!=-1&&(s="=.".indexOf(t[e-2])!=-1?s-2:s-1);const a=new Uint8Array(s);let n=0;return function(i,o){function r(d){for(;l<i.length;){const c=i.charAt(l++),u=ua[c];if(u!=null)return u;if(!/^[\s\xa0]*$/.test(c))throw Error("Unknown base64 encoding at char: "+c)}return d}Td();let l=0;for(;;){const d=r(-1),c=r(0),u=r(64),h=r(64);if(h===64&&d===-1)break;o(d<<2|c>>4),u!=64&&(o(c<<4&240|u>>2),h!=64&&o(u<<6&192|h))}}(t,function(i){a[n++]=i}),n!==s?a.subarray(0,n):a}function Td(){if(!ua){ua={};var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),e=["+/=","+/","-_=","-_.","-_"];for(let s=0;s<5;s++){const a=t.concat(e[s].split(""));Ad[s]=a;for(let n=0;n<a.length;n++){const i=a[n];ua[i]===void 0&&(ua[i]=n)}}}}var Cd=typeof Uint8Array<"u",Ld=!jp&&typeof btoa=="function";function qr(t){if(!Ld){var e;e===void 0&&(e=0),Td(),e=Ad[e];var s=Array(Math.floor(t.length/3)),a=e[64]||"";let l=0,d=0;for(;l<t.length-2;l+=3){var n=t[l],i=t[l+1],o=t[l+2],r=e[n>>2];n=e[(3&n)<<4|i>>4],i=e[(15&i)<<2|o>>6],o=e[63&o],s[d++]=r+n+i+o}switch(r=0,o=a,t.length-l){case 2:o=e[(15&(r=t[l+1]))<<2]||a;case 1:t=t[l],s[d]=e[t>>2]+e[(3&t)<<4|r>>4]+o+a}return s.join("")}for(e="",s=0,a=t.length-10240;s<a;)e+=String.fromCharCode.apply(null,t.subarray(s,s+=10240));return e+=String.fromCharCode.apply(null,s?t.subarray(s):t),btoa(e)}const Rr=/[-_.]/g,Dp={"-":"+",_:"/",".":"="};function qp(t){return Dp[t]||""}function Id(t){if(!Ld)return Pp(t);Rr.test(t)&&(t=t.replace(Rr,qp)),t=atob(t);const e=new Uint8Array(t.length);for(let s=0;s<t.length;s++)e[s]=t.charCodeAt(s);return e}function Ta(t){return Cd&&t!=null&&t instanceof Uint8Array}var Ns={};function gs(){return Rp||(Rp=new It(null,Ns))}function oo(t){Md(Ns);var e=t.g;return(e=e==null||Ta(e)?e:typeof e=="string"?Id(e):null)==null?e:t.g=e}var It=class{h(){return new Uint8Array(oo(this)||0)}constructor(t,e){if(Md(e),this.g=t,t!=null&&t.length===0)throw Error("ByteString should be constructed with non-empty values")}};let Rp,Op;function Md(t){if(t!==Ns)throw Error("illegal external caller")}function _d(t,e){t.__closure__error__context__984382||(t.__closure__error__context__984382={}),t.__closure__error__context__984382.severity=e}function _i(t){return _d(t=Error(t),"warning"),t}var Sn=typeof Symbol=="function"&&typeof Symbol()=="symbol",Fp=new Set;function Ca(t,e,s=!1,a=!1){return t=typeof Symbol=="function"&&typeof Symbol()=="symbol"?a&&Symbol.for&&t?Symbol.for(t):t!=null?Symbol(t):Symbol():e,s&&Fp.add(t),t}var Bp=Ca("jas",void 0,!0,!0),Or=Ca(void 0,"0di"),ni=Ca(void 0,"2ex"),oa=Ca(void 0,"1oa",!0),Hs=Ca(void 0,Symbol(),!0);const C=Sn?Bp:"Ga",jd={Ga:{value:0,configurable:!0,writable:!0,enumerable:!1}},Pd=Object.defineProperties;function kn(t,e){Sn||C in t||Pd(t,jd),t[C]|=e}function ce(t,e){Sn||C in t||Pd(t,jd),t[C]=e}function Xs(t){return kn(t,34),t}function Np(t,e){ce(e,-30975&(0|t))}function ji(t,e){ce(e,-30941&(34|t))}function ro(){return typeof BigInt=="function"}function je(t){return Array.prototype.slice.call(t)}var lo,La={},Dd={};function Fr(t){return!(!t||typeof t!="object"||t.Ia!==Dd)}function co(t){return t!==null&&typeof t=="object"&&!Array.isArray(t)&&t.constructor===Object}function uo(t,e){if(t!=null){if(typeof t=="string")t=t?new It(t,Ns):gs();else if(t.constructor!==It)if(Ta(t))t=t.length?new It(new Uint8Array(t),Ns):gs();else{if(!e)throw Error();t=void 0}}return t}function cn(t){return!(!Array.isArray(t)||t.length)&&!!(1&(0|t[C]))}const Br=[];function Xt(t){if(2&t)throw Error()}ce(Br,55),lo=Object.freeze(Br);class un{constructor(e,s,a){this.l=0,this.g=e,this.h=s,this.m=a}next(){if(this.l<this.g.length){const e=this.g[this.l++];return{done:!1,value:this.h?this.h.call(this.m,e):e}}return{done:!0,value:void 0}}[Symbol.iterator](){return new un(this.g,this.h,this.m)}}function po(t){return Hs?t[Hs]:void 0}var Hp=Object.freeze({});function $n(t){return t.Qa=!0,t}var Up=$n(t=>typeof t=="number"),Nr=$n(t=>typeof t=="string"),Vp=$n(t=>typeof t=="boolean"),En=typeof xs.BigInt=="function"&&typeof xs.BigInt(0)=="bigint",Pi=$n(t=>En?t>=Jp&&t<=Qp:t[0]==="-"?Hr(t,Gp):Hr(t,Wp));const Gp=Number.MIN_SAFE_INTEGER.toString(),Jp=En?BigInt(Number.MIN_SAFE_INTEGER):void 0,Wp=Number.MAX_SAFE_INTEGER.toString(),Qp=En?BigInt(Number.MAX_SAFE_INTEGER):void 0;function Hr(t,e){if(t.length>e.length)return!1;if(t.length<e.length||t===e)return!0;for(let s=0;s<t.length;s++){const a=t[s],n=e[s];if(a>n)return!1;if(a<n)return!0}}const zp=typeof Uint8Array.prototype.slice=="function";let qd,W=0,ie=0;function Ur(t){const e=t>>>0;W=e,ie=(t-e)/4294967296>>>0}function Us(t){if(t<0){Ur(-t);const[e,s]=mo(W,ie);W=e>>>0,ie=s>>>0}else Ur(t)}function ho(t){const e=qd||(qd=new DataView(new ArrayBuffer(8)));e.setFloat32(0,+t,!0),ie=0,W=e.getUint32(0,!0)}function fo(t,e){const s=4294967296*e+(t>>>0);return Number.isSafeInteger(s)?s:Sa(t,e)}function bo(t,e){const s=2147483648&e;return s&&(e=~e>>>0,(t=1+~t>>>0)==0&&(e=e+1>>>0)),typeof(t=fo(t,e))=="number"?s?-t:t:s?"-"+t:t}function Sa(t,e){if(t>>>=0,(e>>>=0)<=2097151)var s=""+(4294967296*e+t);else ro()?s=""+(BigInt(e)<<BigInt(32)|BigInt(t)):(t=(16777215&t)+6777216*(s=16777215&(t>>>24|e<<8))+6710656*(e=e>>16&65535),s+=8147497*e,e*=2,t>=1e7&&(s+=t/1e7>>>0,t%=1e7),s>=1e7&&(e+=s/1e7>>>0,s%=1e7),s=e+Vr(s)+Vr(t));return s}function Vr(t){return t=String(t),"0000000".slice(t.length)+t}function An(t){if(t.length<16)Us(Number(t));else if(ro())t=BigInt(t),W=Number(t&BigInt(4294967295))>>>0,ie=Number(t>>BigInt(32)&BigInt(4294967295));else{const e=+(t[0]==="-");ie=W=0;const s=t.length;for(let a=e,n=(s-e)%6+e;n<=s;a=n,n+=6){const i=Number(t.slice(a,n));ie*=1e6,W=1e6*W+i,W>=4294967296&&(ie+=Math.trunc(W/4294967296),ie>>>=0,W>>>=0)}if(e){const[a,n]=mo(W,ie);W=a,ie=n}}}function mo(t,e){return e=~e,t?t=1+~t:e+=1,[t,e]}const xo=typeof BigInt=="function"?BigInt.asIntN:void 0,Kp=typeof BigInt=="function"?BigInt.asUintN:void 0,js=Number.isSafeInteger,Tn=Number.isFinite,pn=Math.trunc;function Zt(t){return t==null||typeof t=="number"?t:t==="NaN"||t==="Infinity"||t==="-Infinity"?Number(t):void 0}function Rd(t){return t==null||typeof t=="boolean"?t:typeof t=="number"?!!t:void 0}const Yp=/^-?([1-9][0-9]*|0)(\.[0-9]+)?$/;function Cn(t){switch(typeof t){case"bigint":return!0;case"number":return Tn(t);case"string":return Yp.test(t);default:return!1}}function Zs(t){if(t==null)return t;if(typeof t=="string"&&t)t=+t;else if(typeof t!="number")return;return Tn(t)?0|t:void 0}function Od(t){if(t==null)return t;if(typeof t=="string"&&t)t=+t;else if(typeof t!="number")return;return Tn(t)?t>>>0:void 0}function Gr(t){if(t[0]==="-")return!1;const e=t.length;return e<20||e===20&&Number(t.substring(0,6))<184467}function go(t){return t=pn(t),js(t)||(Us(t),t=bo(W,ie)),t}function vo(t){var e=pn(Number(t));if(js(e))return String(e);if((e=t.indexOf("."))!==-1&&(t=t.substring(0,e)),e=t.length,!(t[0]==="-"?e<20||e===20&&Number(t.substring(0,7))>-922337:e<19||e===19&&Number(t.substring(0,6))<922337))if(An(t),t=W,2147483648&(e=ie))if(ro())t=""+(BigInt(0|e)<<BigInt(32)|BigInt(t>>>0));else{const[s,a]=mo(t,e);t="-"+Sa(s,a)}else t=Sa(t,e);return t}function hn(t){return t==null?t:typeof t=="bigint"?(Pi(t)?t=Number(t):(t=xo(64,t),t=Pi(t)?Number(t):String(t)),t):Cn(t)?typeof t=="number"?go(t):vo(t):void 0}function Xp(t){if(t==null)return t;var e=typeof t;if(e==="bigint")return String(Kp(64,t));if(Cn(t)){if(e==="string")return e=pn(Number(t)),js(e)&&e>=0?t=String(e):((e=t.indexOf("."))!==-1&&(t=t.substring(0,e)),Gr(t)||(An(t),t=Sa(W,ie))),t;if(e==="number")return(t=pn(t))>=0&&js(t)?t:function(s){if(s<0){Us(s);var a=Sa(W,ie);return s=Number(a),js(s)?s:a}return Gr(a=String(s))?a:(Us(s),fo(W,ie))}(t)}}function Fd(t){if(typeof t!="string")throw Error();return t}function ea(t){if(t!=null&&typeof t!="string")throw Error();return t}function Vs(t){return t==null||typeof t=="string"?t:void 0}function yo(t,e,s,a){if(t!=null&&typeof t=="object"&&t.W===La)return t;if(!Array.isArray(t))return s?2&a?((t=e[Or])||(Xs((t=new e).u),t=e[Or]=t),e=t):e=new e:e=void 0,e;let n=s=0|t[C];return n===0&&(n|=32&a),n|=2&a,n!==s&&ce(t,n),new e(t)}function Zp(t,e,s){if(e)e:{if(!Cn(e=t))throw _i("int64");switch(typeof e){case"string":e=vo(e);break e;case"bigint":if(t=e=xo(64,e),Nr(t)){if(!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(t))throw Error(String(t))}else if(Up(t)&&!Number.isSafeInteger(t))throw Error(String(t));e=En?BigInt(e):Vp(e)?e?"1":"0":Nr(e)?e.trim()||"0":String(e);break e;default:e=go(e)}}else e=hn(t);return typeof(s=(t=e)==null?s?0:void 0:t)=="string"&&js(e=+s)?e:s}const e0={};let t0=function(){try{return io(new class extends Map{constructor(){super()}}),!1}catch{return!0}}();class ii{constructor(){this.g=new Map}get(e){return this.g.get(e)}set(e,s){return this.g.set(e,s),this.size=this.g.size,this}delete(e){return e=this.g.delete(e),this.size=this.g.size,e}clear(){this.g.clear(),this.size=this.g.size}has(e){return this.g.has(e)}entries(){return this.g.entries()}keys(){return this.g.keys()}values(){return this.g.values()}forEach(e,s){return this.g.forEach(e,s)}[Symbol.iterator](){return this.entries()}}const s0=t0?(Object.setPrototypeOf(ii.prototype,Map.prototype),Object.defineProperties(ii.prototype,{size:{value:0,configurable:!0,enumerable:!0,writable:!0}}),ii):class extends Map{constructor(){super()}};function Jr(t){return t}function oi(t){if(2&t.L)throw Error("Cannot mutate an immutable Map")}var st=class extends s0{constructor(t,e,s=Jr,a=Jr){super();let n=0|t[C];n|=64,ce(t,n),this.L=n,this.S=e,this.R=s,this.Y=this.S?a0:a;for(let i=0;i<t.length;i++){const o=t[i],r=s(o[0],!1,!0);let l=o[1];e?l===void 0&&(l=null):l=a(o[1],!1,!0,void 0,void 0,n),super.set(r,l)}}na(t=Wr){if(this.size!==0)return this.X(t)}X(t=Wr){const e=[],s=super.entries();for(var a;!(a=s.next()).done;)(a=a.value)[0]=t(a[0]),a[1]=t(a[1]),e.push(a);return e}clear(){oi(this),super.clear()}delete(t){return oi(this),super.delete(this.R(t,!0,!1))}entries(){var t=this.ma();return new un(t,n0,this)}keys(){return this.Ha()}values(){var t=this.ma();return new un(t,st.prototype.get,this)}forEach(t,e){super.forEach((s,a)=>{t.call(e,this.get(a),a,this)})}set(t,e){return oi(this),(t=this.R(t,!0,!1))==null?this:e==null?(super.delete(t),this):super.set(t,this.Y(e,!0,!0,this.S,!1,this.L))}Na(t){const e=this.R(t[0],!1,!0);t=t[1],t=this.S?t===void 0?null:t:this.Y(t,!1,!0,void 0,!1,this.L),super.set(e,t)}has(t){return super.has(this.R(t,!1,!1))}get(t){t=this.R(t,!1,!1);const e=super.get(t);if(e!==void 0){var s=this.S;return s?((s=this.Y(e,!1,!0,s,this.ra,this.L))!==e&&super.set(t,s),s):e}}ma(){return Array.from(super.keys())}Ha(){return super.keys()}[Symbol.iterator](){return this.entries()}};function a0(t,e,s,a,n,i){return t=yo(t,a,s,i),n&&(t=In(t)),t}function Wr(t){return t}function n0(t){return[t,this.get(t)]}let i0,Bd,o0;function Qr(){return i0||(i0=new st(Xs([]),void 0,void 0,void 0,e0))}function wo(t,e,s,a,n){if(t!=null){if(Array.isArray(t))t=cn(t)?void 0:n&&2&(0|t[C])?t:So(t,e,s,a!==void 0,n);else if(co(t)){const i={};for(let o in t)i[o]=wo(t[o],e,s,a,n);t=i}else t=e(t,a);return t}}function So(t,e,s,a,n){const i=a||s?0|t[C]:0,o=a?!!(32&i):void 0;a=je(t);for(let r=0;r<a.length;r++)a[r]=wo(a[r],e,s,o,n);return s&&((t=po(t))&&(a[Hs]=je(t)),s(i,a)),a}function r0(t){return wo(t,Nd,void 0,void 0,!1)}function Nd(t){return t.W===La?t.toJSON():t instanceof st?t.na(r0):function(e){switch(typeof e){case"number":return isFinite(e)?e:String(e);case"bigint":return Pi(e)?Number(e):String(e);case"boolean":return e?1:0;case"object":if(e)if(Array.isArray(e)){if(cn(e))return}else{if(Ta(e))return qr(e);if(e instanceof It){const s=e.g;return s==null?"":typeof s=="string"?s:e.g=qr(s)}if(e instanceof st)return e.na()}}return e}(t)}function Hd(t){return So(t,Nd,void 0,void 0,!1)}function Qt(t,e,s){return t=Ud(t,e[0],e[1],s?1:2),e!==Bd&&s&&kn(t,16384),t}function Ud(t,e,s,a){if(t==null){var n=96;s?(t=[s],n|=512):t=[],e&&(n=-33521665&n|(1023&e)<<15)}else{if(!Array.isArray(t))throw Error("narr");if(2048&(n=0|t[C]))throw Error("farr");if(64&n)return t;if(a===1||a===2||(n|=64),s&&(n|=512,s!==t[0]))throw Error("mid");e:{if(a=(s=t).length){const i=a-1;if(co(s[i])){if((e=i-(512&(n|=256)?0:-1))>=1024)throw Error("pvtlmt");n=-33521665&n|(1023&e)<<15;break e}}if(e){if((e=Math.max(e,a-(512&n?0:-1)))>1024)throw Error("spvt");n=-33521665&n|(1023&e)<<15}}}return ce(t,n),t}function Di(t,e,s=ji){if(t!=null){if(Cd&&t instanceof Uint8Array)return e?t:new Uint8Array(t);if(Array.isArray(t)){var a=0|t[C];return 2&a?t:(e&&(e=a===0||!!(32&a)&&!(64&a||!(16&a))),e?(ce(t,-12293&(34|a)),t):So(t,Di,4&a?ji:s,!0,!0))}return t.W===La?t=2&(a=0|(s=t.u)[C])?t:new t.constructor(Ln(s,a,!0)):t instanceof st&&!(2&t.L)&&(s=Xs(t.X(Di)),t=new st(s,t.S,t.R,t.Y)),t}}function Ln(t,e,s){const a=s||2&e?ji:Np,n=!!(32&e);return t=function(i,o,r){const l=je(i);var d=l.length;const c=256&o?l[d-1]:void 0;for(d+=c?-1:0,o=512&o?1:0;o<d;o++)l[o]=r(l[o]);if(c){o=l[o]={};for(const u in c)o[u]=r(c[u])}return(i=po(i))&&(l[Hs]=je(i)),l}(t,e,i=>Di(i,n,a)),kn(t,32|(s?2:0)),t}function In(t){const e=t.u,s=0|e[C];return 2&s?new t.constructor(Ln(e,s,!1)):t}function Gs(t,e){return qt(t=t.u,0|t[C],e)}function qt(t,e,s,a){if(s===-1)return null;var n=s+(512&e?0:-1);const i=t.length-1;return n>=i&&256&e?t[i][s]:a&&256&e&&(e=t[i][s])!=null?(t[n]!=null&&ni!=null&&((n=(t=Op??(Op={}))[ni]||0)>=4||(t[ni]=n+1,_d(t=Error(),"incident"),function(o){xs.setTimeout(()=>{throw o},0)}(t))),e):n<=i?t[n]:void 0}function z(t,e,s){const a=t.u;let n=0|a[C];return Xt(n),ae(a,n,e,s),t}function ae(t,e,s,a){const n=512&e?0:-1,i=s+n;var o=t.length-1;return i>=o&&256&e?(t[o][s]=a,e):i<=o?(t[i]=a,256&e&&s in(t=t[o])&&delete t[s],e):(a!==void 0&&(s>=(o=e>>15&1023||536870912)?a!=null&&(t[o+n]={[s]:a},ce(t,e|=256)):t[i]=a),e)}function Xa(t,e){let s=0|(t=t.u)[C];const a=qt(t,s,e),n=Zt(a);return n!=null&&n!==a&&ae(t,s,e,n),n}function Vd(t){let e=0|(t=t.u)[C];const s=qt(t,e,1),a=uo(s,!0);return a!=null&&a!==s&&ae(t,e,1,a),a}function cs(){return Hp===void 0?2:4}function us(t,e,s,a,n){const i=t.u,o=2&(t=0|i[C])?1:a;n=!!n;let r=0|(a=ko(i,t,e))[C];if(!(4&r)){4&r&&(a=je(a),r=Mt(r,t),t=ae(i,t,e,a));let l=0,d=0;for(;l<a.length;l++){const c=s(a[l]);c!=null&&(a[d++]=c)}d<l&&(a.length=d),r=$o(r,t),s=-4097&(20|r),r=s&=-8193,ce(a,r),2&r&&Object.freeze(a)}return o===1||o===4&&32&r?Lt(r)||(n=r,r|=2,r!==n&&ce(a,r),Object.freeze(a)):(o===2&&Lt(r)&&(a=je(a),r=Mt(r,t),r=zt(r,t,n),ce(a,r),t=ae(i,t,e,a)),Lt(r)||(e=r,r=zt(r,t,n),r!==e&&ce(a,r))),a}function ko(t,e,s,a){return t=qt(t,e,s,a),Array.isArray(t)?t:lo}function $o(t,e){return t===0&&(t=Mt(t,e)),1|t}function Lt(t){return!!(2&t)&&!!(4&t)||!!(2048&t)}function Gd(t){t=je(t);for(let e=0;e<t.length;e++){const s=t[e]=je(t[e]);Array.isArray(s[1])&&(s[1]=Xs(s[1]))}return t}function qi(t,e,s,a){let n=0|(t=t.u)[C];Xt(n),ae(t,n,e,(a==="0"?Number(s)===0:s===a)?void 0:s)}function ta(t,e,s,a,n){Xt(e);var i=!(!(64&e)&&16384&e);const o=(n=ko(t,e,s,n))!==lo;if(i||!o){let r=i=o?0|n[C]:0;(!o||2&r||Lt(r)||4&r&&!(32&r))&&(n=je(n),r=Mt(r,e),e=ae(t,e,s,n)),r=-13&$o(r,e),r=zt(a?-17&r:16|r,e,!0),r!==i&&ce(n,r)}return n}function ri(t,e){var s=Pc;return Ao(Eo(t=t.u),t,0|t[C],s)===e?e:-1}function Eo(t){if(Sn)return t[oa]??(t[oa]=new Map);if(oa in t)return t[oa];const e=new Map;return Object.defineProperty(t,oa,{value:e}),e}function Jd(t,e,s,a){const n=Eo(t),i=Ao(n,t,e,s);return i!==a&&(i&&(e=ae(t,e,i)),n.set(s,a)),e}function Ao(t,e,s,a){let n=t.get(a);if(n!=null)return n;n=0;for(let i=0;i<a.length;i++){const o=a[i];qt(e,s,o)!=null&&(n!==0&&(s=ae(e,s,n)),n=o)}return t.set(a,n),n}function To(t,e,s,a){let n,i=0|t[C];if((a=qt(t,i,s,a))!=null&&a.W===La)return(e=In(a))!==a&&ae(t,i,s,e),e.u;if(Array.isArray(a)){const o=0|a[C];n=2&o?Qt(Ln(a,o,!1),e,!0):64&o?a:Qt(n,e,!0)}else n=Qt(void 0,e,!0);return n!==a&&ae(t,i,s,n),n}function Wd(t,e,s,a){let n=0|(t=t.u)[C];return(e=yo(a=qt(t,n,s,a),e,!1,n))!==a&&e!=null&&ae(t,n,s,e),e}function H(t,e,s,a=!1){if((e=Wd(t,e,s,a))==null)return e;if(!(2&(a=0|(t=t.u)[C]))){const n=In(e);n!==e&&ae(t,a,s,e=n)}return e}function Qd(t,e,s,a,n,i,o){t=t.u;var r=!!(2&e);const l=r?1:n;i=!!i,o&&(o=!r);var d=0|(n=ko(t,e,a))[C];if(!(r=!!(4&d))){var c=n,u=e;const h=!!(2&(d=$o(d,e)));h&&(u|=2);let p=!h,f=!0,g=0,m=0;for(;g<c.length;g++){const w=yo(c[g],s,!1,u);if(w instanceof s){if(!h){const v=!!(2&(0|w.u[C]));p&&(p=!v),f&&(f=v)}c[m++]=w}}m<g&&(c.length=m),d|=4,d=f?16|d:-17&d,ce(c,d=p?8|d:-9&d),h&&Object.freeze(c)}if(o&&!(8&d||!n.length&&(l===1||l===4&&32&d))){for(Lt(d)&&(n=je(n),d=Mt(d,e),e=ae(t,e,a,n)),s=n,o=d,c=0;c<s.length;c++)(d=s[c])!==(u=In(d))&&(s[c]=u);o|=8,ce(s,o=s.length?-17&o:16|o),d=o}return l===1||l===4&&32&d?Lt(d)||(e=d,(d|=!n.length||16&d&&(!r||32&d)?2:2048)!==e&&ce(n,d),Object.freeze(n)):(l===2&&Lt(d)&&(ce(n=je(n),d=zt(d=Mt(d,e),e,i)),e=ae(t,e,a,n)),Lt(d)||(a=d,(d=zt(d,e,i))!==a&&ce(n,d))),n}function Pt(t,e,s){const a=0|t.u[C];return Qd(t,a,e,s,cs(),!1,!(2&a))}function I(t,e,s,a){return a==null&&(a=void 0),z(t,s,a)}function ma(t,e,s,a){a==null&&(a=void 0);e:{let n=0|(t=t.u)[C];if(Xt(n),a==null){const i=Eo(t);if(Ao(i,t,n,s)!==e)break e;i.set(s,0)}else n=Jd(t,n,s,e);ae(t,n,e,a)}}function Mt(t,e){return-2049&(t=32|(2&e?2|t:-3&t))}function zt(t,e,s){return 32&e&&s||(t&=-33),t}function fn(t,e,s,a){const n=0|t.u[C];Xt(n),t=Qd(t,n,s,e,2,!0),a=a??new s,t.push(a),t[C]=2&(0|a.u[C])?-9&t[C]:-17&t[C]}function tt(t,e){return Zs(Gs(t,e))}function at(t,e){return Vs(Gs(t,e))}function re(t,e){return Xa(t,e)??0}function ka(t,e,s){if(s!=null&&typeof s!="boolean")throw t=typeof s,Error(`Expected boolean but got ${t!="object"?t:s?Array.isArray(s)?"array":t:"null"}: ${s}`);z(t,e,s)}function wt(t,e,s){if(s!=null){if(typeof s!="number"||!Tn(s))throw _i("int32");s|=0}z(t,e,s)}function A(t,e,s){if(s!=null&&typeof s!="number")throw Error(`Value of float/double field must be a number, found ${typeof s}: ${s}`);z(t,e,s)}function bn(t,e,s){{const o=t.u;let r=0|o[C];if(Xt(r),s==null)ae(o,r,e);else{var a=t=0|s[C],n=Lt(t),i=n||Object.isFrozen(s);for(n||(t=0),i||(s=je(s),a=0,t=zt(t=Mt(t,r),r,!0),i=!1),t|=21,n=0;n<s.length;n++){const l=s[n],d=Fd(l);Object.is(l,d)||(i&&(s=je(s),a=0,t=zt(t=Mt(t,r),r,!0),i=!1),s[n]=d)}t!==a&&(i&&(s=je(s),t=zt(t=Mt(t,r),r,!0)),ce(s,t)),ae(o,r,e,s)}}}function Mn(t,e,s){Xt(0|t.u[C]),us(t,e,Vs,2,!0).push(Fd(s))}function zd(t,e){return Error(`Invalid wire type: ${t} (at position ${e})`)}function Co(){return Error("Failed to read varint, encoding is invalid.")}function Kd(t,e){return Error(`Tried to read past the end of the data ${e} > ${t}`)}function Lo(t){if(typeof t=="string")return{buffer:Id(t),N:!1};if(Array.isArray(t))return{buffer:new Uint8Array(t),N:!1};if(t.constructor===Uint8Array)return{buffer:t,N:!1};if(t.constructor===ArrayBuffer)return{buffer:new Uint8Array(t),N:!1};if(t.constructor===It)return{buffer:oo(t)||new Uint8Array(0),N:!0};if(t instanceof Uint8Array)return{buffer:new Uint8Array(t.buffer,t.byteOffset,t.byteLength),N:!1};throw Error("Type not convertible to a Uint8Array, expected a Uint8Array, an ArrayBuffer, a base64 encoded string, a ByteString or an Array of numbers")}function Io(t,e){let s,a=0,n=0,i=0;const o=t.h;let r=t.g;do s=o[r++],a|=(127&s)<<i,i+=7;while(i<32&&128&s);for(i>32&&(n|=(127&s)>>4),i=3;i<32&&128&s;i+=7)s=o[r++],n|=(127&s)<<i;if(ms(t,r),s<128)return e(a>>>0,n>>>0);throw Co()}function Mo(t){let e=0,s=t.g;const a=s+10,n=t.h;for(;s<a;){const i=n[s++];if(e|=i,(128&i)==0)return ms(t,s),!!(127&e)}throw Co()}function Kt(t){const e=t.h;let s=t.g,a=e[s++],n=127&a;if(128&a&&(a=e[s++],n|=(127&a)<<7,128&a&&(a=e[s++],n|=(127&a)<<14,128&a&&(a=e[s++],n|=(127&a)<<21,128&a&&(a=e[s++],n|=a<<28,128&a&&128&e[s++]&&128&e[s++]&&128&e[s++]&&128&e[s++]&&128&e[s++])))))throw Co();return ms(t,s),n}function Dt(t){return Kt(t)>>>0}function Ri(t){var e=t.h;const s=t.g,a=e[s],n=e[s+1],i=e[s+2];return e=e[s+3],ms(t,t.g+4),(a<<0|n<<8|i<<16|e<<24)>>>0}function Oi(t){var e=Ri(t);t=2*(e>>31)+1;const s=e>>>23&255;return e&=8388607,s==255?e?NaN:t*(1/0):s==0?1401298464324817e-60*t*e:t*Math.pow(2,s-150)*(e+8388608)}function l0(t){return Kt(t)}function li(t,e,{ba:s=!1}={}){t.ba=s,e&&(e=Lo(e),t.h=e.buffer,t.m=e.N,t.j=0,t.l=t.h.length,t.g=t.j)}function ms(t,e){if(t.g=e,e>t.l)throw Kd(t.l,e)}function Yd(t,e){if(e<0)throw Error(`Tried to read a negative byte length: ${e}`);const s=t.g,a=s+e;if(a>t.l)throw Kd(e,t.l-s);return t.g=a,s}function Xd(t,e){if(e==0)return gs();var s=Yd(t,e);return t.ba&&t.m?s=t.h.subarray(s,s+e):(t=t.h,s=s===(e=s+e)?new Uint8Array(0):zp?t.slice(s,e):new Uint8Array(t.subarray(s,e))),s.length==0?gs():new It(s,Ns)}st.prototype.toJSON=void 0,st.prototype.Ia=Dd;var zr=[];function Zd(t){var e=t.g;if(e.g==e.l)return!1;t.l=t.g.g;var s=Dt(t.g);if(e=s>>>3,!((s&=7)>=0&&s<=5))throw zd(s,t.l);if(e<1)throw Error(`Invalid field number: ${e} (at position ${t.l})`);return t.m=e,t.h=s,!0}function Za(t){switch(t.h){case 0:t.h!=0?Za(t):Mo(t.g);break;case 1:ms(t=t.g,t.g+8);break;case 2:if(t.h!=2)Za(t);else{var e=Dt(t.g);ms(t=t.g,t.g+e)}break;case 5:ms(t=t.g,t.g+4);break;case 3:for(e=t.m;;){if(!Zd(t))throw Error("Unmatched start-group tag: stream EOF");if(t.h==4){if(t.m!=e)throw Error("Unmatched end-group tag");break}Za(t)}break;default:throw zd(t.h,t.l)}}function Ia(t,e,s){const a=t.g.l,n=Dt(t.g),i=t.g.g+n;let o=i-a;if(o<=0&&(t.g.l=i,s(e,t,void 0,void 0,void 0),o=i-t.g.g),o)throw Error(`Message parsing ended unexpectedly. Expected to read ${n} bytes, instead read ${n-o} bytes, either the data ended unexpectedly or the message misreported its own length`);return t.g.g=i,t.g.l=a,e}function _o(t){var e=Dt(t.g),s=Yd(t=t.g,e);if(t=t.h,Ip){var a,n=t;(a=ei)||(a=ei=new TextDecoder("utf-8",{fatal:!0})),e=s+e,n=s===0&&e===n.length?n:n.subarray(s,e);try{var i=a.decode(n)}catch(r){if(Oa===void 0){try{a.decode(new Uint8Array([128]))}catch{}try{a.decode(new Uint8Array([97])),Oa=!0}catch{Oa=!1}}throw!Oa&&(ei=void 0),r}}else{e=(i=s)+e,s=[];let r,l=null;for(;i<e;){var o=t[i++];o<128?s.push(o):o<224?i>=e?as():(r=t[i++],o<194||(192&r)!=128?(i--,as()):s.push((31&o)<<6|63&r)):o<240?i>=e-1?as():(r=t[i++],(192&r)!=128||o===224&&r<160||o===237&&r>=160||(192&(a=t[i++]))!=128?(i--,as()):s.push((15&o)<<12|(63&r)<<6|63&a)):o<=244?i>=e-2?as():(r=t[i++],(192&r)!=128||r-144+(o<<28)>>30||(192&(a=t[i++]))!=128||(192&(n=t[i++]))!=128?(i--,as()):(o=(7&o)<<18|(63&r)<<12|(63&a)<<6|63&n,o-=65536,s.push(55296+(o>>10&1023),56320+(1023&o)))):as(),s.length>=8192&&(l=_r(l,s),s.length=0)}i=_r(l,s)}return i}function ec(t){const e=Dt(t.g);return Xd(t.g,e)}function _n(t,e,s){var a=Dt(t.g);for(a=t.g.g+a;t.g.g<a;)s.push(e(t.g))}var Fa=[];function d0(t){return t}let Ps;function dt(t,e,s){e.g?e.m(t,e.g,e.h,s):e.m(t,e.h,s)}var $=class{constructor(t,e){this.u=Ud(t,e)}toJSON(){const t=!Ps;try{return t&&(Ps=Hd),tc(this)}finally{t&&(Ps=void 0)}}l(){var t=G0;return t.g?t.l(this,t.g,t.h,!0):t.l(this,t.h,t.defaultValue,!0)}clone(){const t=this.u;return new this.constructor(Ln(t,0|t[C],!1))}N(){return!!(2&(0|this.u[C]))}};function tc(t){var e=t.u;{e=(t=Ps(e))!==e;let d=t.length;if(d){var s=t[d-1],a=co(s);a?d--:s=void 0;var n=t;if(a){e:{var i,o=s,r=!1;if(o)for(let c in o)isNaN(+c)?(i??(i={}))[c]=o[c]:(a=o[c],Array.isArray(a)&&(cn(a)||Fr(a)&&a.size===0)&&(a=null),a==null&&(r=!0),a!=null&&((i??(i={}))[c]=a));if(r||(i=o),i)for(let c in i){r=i;break e}r=null}o=r==null?s!=null:r!==s}for(;d>0&&((i=n[d-1])==null||cn(i)||Fr(i)&&i.size===0);d--)var l=!0;(n!==t||o||l)&&(e?(l||o||r)&&(n.length=d):n=Array.prototype.slice.call(n,0,d),r&&n.push(r)),l=n}else l=t}return l}function Kr(t){return t?/^\d+$/.test(t)?(An(t),new Fi(W,ie)):null:c0||(c0=new Fi(0,0))}$.prototype.W=La,$.prototype.toString=function(){try{return Ps=d0,tc(this).toString()}finally{Ps=void 0}};var Fi=class{constructor(t,e){this.h=t>>>0,this.g=e>>>0}};let c0;function Yr(t){return t?/^-?\d+$/.test(t)?(An(t),new Bi(W,ie)):null:u0||(u0=new Bi(0,0))}var Bi=class{constructor(t,e){this.h=t>>>0,this.g=e>>>0}};let u0;function Ds(t,e,s){for(;s>0||e>127;)t.g.push(127&e|128),e=(e>>>7|s<<25)>>>0,s>>>=7;t.g.push(e)}function sa(t,e){for(;e>127;)t.g.push(127&e|128),e>>>=7;t.g.push(e)}function jn(t,e){if(e>=0)sa(t,e);else{for(let s=0;s<9;s++)t.g.push(127&e|128),e>>=7;t.g.push(1)}}function $a(t,e){t.g.push(e>>>0&255),t.g.push(e>>>8&255),t.g.push(e>>>16&255),t.g.push(e>>>24&255)}function Js(t,e){e.length!==0&&(t.l.push(e),t.h+=e.length)}function Je(t,e,s){sa(t.g,8*e+s)}function jo(t,e){return Je(t,e,2),e=t.g.end(),Js(t,e),e.push(t.h),e}function Po(t,e){var s=e.pop();for(s=t.h+t.g.length()-s;s>127;)e.push(127&s|128),s>>>=7,t.h++;e.push(s),t.h++}function Pn(t,e,s){Je(t,e,2),sa(t.g,s.length),Js(t,t.g.end()),Js(t,s)}function mn(t,e,s,a){s!=null&&(e=jo(t,e),a(s,t),Po(t,e))}function ct(){const t=class{constructor(){throw Error()}};return Object.setPrototypeOf(t,t.prototype),t}var Do=ct(),sc=ct(),qo=ct(),Ro=ct(),ac=ct(),nc=ct(),Oo=ct(),ic=ct(),oc=ct(),aa=class{constructor(t,e,s){this.g=t,this.h=e,t=Do,this.l=!!t&&s===t||!1}};function Dn(t,e){return new aa(t,e,Do)}function rc(t,e,s,a,n){mn(t,s,uc(e,a),n)}const p0=Dn(function(t,e,s,a,n){return t.h===2&&(Ia(t,To(e,a,s),n),!0)},rc),h0=Dn(function(t,e,s,a,n){return t.h===2&&(Ia(t,To(e,a,s,!0),n),!0)},rc);var qn=Symbol(),Fo=Symbol(),Xr=Symbol(),Zr=Symbol();let lc,dc;function vs(t,e,s,a){var n=a[t];if(n)return n;(n={}).Pa=a,n.V=function(u){switch(typeof u){case"boolean":return Bd||(Bd=[0,void 0,!0]);case"number":return u>0?void 0:u===0?o0||(o0=[0,void 0]):[-u,void 0];case"string":return[0,u];case"object":return u}}(a[0]);var i=a[1];let o=1;i&&i.constructor===Object&&(n.ga=i,typeof(i=a[++o])=="function"&&(n.la=!0,lc??(lc=i),dc??(dc=a[o+1]),i=a[o+=2]));const r={};for(;i&&Array.isArray(i)&&i.length&&typeof i[0]=="number"&&i[0]>0;){for(var l=0;l<i.length;l++)r[i[l]]=i;i=a[++o]}for(l=1;i!==void 0;){let u;typeof i=="number"&&(l+=i,i=a[++o]);var d=void 0;if(i instanceof aa?u=i:(u=p0,o--),u==null?void 0:u.l){i=a[++o],d=a;var c=o;typeof i=="function"&&(i=i(),d[c]=i),d=i}for(c=l+1,typeof(i=a[++o])=="number"&&i<0&&(c-=i,i=a[++o]);l<c;l++){const h=r[l];d?s(n,l,u,d,h):e(n,l,u,h)}}return a[t]=n}function cc(t){return Array.isArray(t)?t[0]instanceof aa?t:[h0,t]:[t,void 0]}function uc(t,e){return t instanceof $?t.u:Array.isArray(t)?Qt(t,e,!1):void 0}function Bo(t,e,s,a){const n=s.g;t[e]=a?(i,o,r)=>n(i,o,r,a):n}function No(t,e,s,a,n){const i=s.g;let o,r;t[e]=(l,d,c)=>i(l,d,c,r||(r=vs(Fo,Bo,No,a).V),o||(o=Ho(a)),n)}function Ho(t){let e=t[Xr];if(e!=null)return e;const s=vs(Fo,Bo,No,t);return e=s.la?(a,n)=>lc(a,n,s):(a,n)=>{const i=0|a[C];for(;Zd(n)&&n.h!=4;){var o=n.m,r=s[o];if(r==null){var l=s.ga;l&&(l=l[o])&&(l=f0(l))!=null&&(r=s[o]=l)}r!=null&&r(n,a,o)||(o=(r=n).l,Za(r),r.fa?r=void 0:(l=r.g.g-o,r.g.g=o,r=Xd(r.g,l)),o=a,r&&((l=o[Hs])?l.push(r):o[Hs]=[r]))}return 16384&i&&Xs(a),!0},t[Xr]=e}function f0(t){const e=(t=cc(t))[0].g;if(t=t[1]){const s=Ho(t),a=vs(Fo,Bo,No,t).V;return(n,i,o)=>e(n,i,o,a,s)}return e}function Rn(t,e,s){t[e]=s.h}function On(t,e,s,a){let n,i;const o=s.h;t[e]=(r,l,d)=>o(r,l,d,i||(i=vs(qn,Rn,On,a).V),n||(n=pc(a)))}function pc(t){let e=t[Zr];if(!e){const s=vs(qn,Rn,On,t);e=(a,n)=>hc(a,n,s),t[Zr]=e}return e}function hc(t,e,s){for(var a=0|t[C],n=512&a?0:-1,i=t.length,o=512&a?1:0,r=i+(256&a?-1:0);o<r;o++){const l=t[o];if(l==null)continue;const d=o-n,c=el(s,d);c&&c(e,l,d)}if(256&a){a=t[i-1];for(const l in a)n=+l,Number.isNaN(n)||(i=a[n])!=null&&(r=el(s,n))&&r(e,i,n)}if(t=po(t))for(Js(e,e.g.end()),s=0;s<t.length;s++)Js(e,oo(t[s])||new Uint8Array(0))}function el(t,e){var s=t[e];if(s)return s;if((s=t.ga)&&(s=s[e])){var a=(s=cc(s))[0].h;if(s=s[1]){const n=pc(s),i=vs(qn,Rn,On,s).V;s=t.la?dc(i,n):(o,r,l)=>a(o,r,l,i,n)}else s=a;return t[e]=s}}function na(t,e){if(Array.isArray(e)){var s=0|e[C];if(4&s)return e;for(var a=0,n=0;a<e.length;a++){const i=t(e[a]);i!=null&&(e[n++]=i)}return n<a&&(e.length=n),ce(e,-12289&(5|s)),2&s&&Object.freeze(e),e}}function Ae(t,e,s){return new aa(t,e,s)}function ia(t,e,s){return new aa(t,e,s)}function Te(t,e,s){ae(t,0|t[C],e,s)}var b0=Dn(function(t,e,s,a,n){return t.h===2&&(t=Ia(t,Qt([void 0,void 0],a,!0),n),Xt(a=0|e[C]),(n=qt(e,a,s))instanceof st?2&n.L?((n=n.X()).push(t),ae(e,a,s,n)):n.Na(t):Array.isArray(n)?(2&(0|n[C])&&ae(e,a,s,n=Gd(n)),n.push(t)):ae(e,a,s,[t]),!0)},function(t,e,s,a,n){if(e instanceof st)e.forEach((i,o)=>{mn(t,s,Qt([o,i],a,!1),n)});else if(Array.isArray(e))for(let i=0;i<e.length;i++){const o=e[i];Array.isArray(o)&&mn(t,s,Qt(o,a,!1),n)}});function fc(t,e,s){if(e=function(a){if(a==null)return a;const n=typeof a;if(n==="bigint")return String(xo(64,a));if(Cn(a)){if(n==="string")return vo(a);if(n==="number")return go(a)}}(e),e!=null&&(typeof e=="string"&&Yr(e),e!=null))switch(Je(t,s,0),typeof e){case"number":t=t.g,Us(e),Ds(t,W,ie);break;case"bigint":s=BigInt.asUintN(64,e),s=new Bi(Number(s&BigInt(4294967295)),Number(s>>BigInt(32))),Ds(t.g,s.h,s.g);break;default:s=Yr(e),Ds(t.g,s.h,s.g)}}function bc(t,e,s){(e=Zs(e))!=null&&e!=null&&(Je(t,s,0),jn(t.g,e))}function mc(t,e,s){(e=Rd(e))!=null&&(Je(t,s,0),t.g.g.push(e?1:0))}function xc(t,e,s){(e=Vs(e))!=null&&Pn(t,s,Ed(e))}function gc(t,e,s,a,n){mn(t,s,uc(e,a),n)}function vc(t,e,s){(e=e==null||typeof e=="string"||Ta(e)||e instanceof It?e:void 0)!=null&&Pn(t,s,Lo(e).buffer)}function yc(t,e,s){return(t.h===5||t.h===2)&&(e=ta(e,0|e[C],s,!1,!1),t.h==2?_n(t,Oi,e):e.push(Oi(t.g)),!0)}var At=Ae(function(t,e,s){if(t.h!==1)return!1;var a=t.g;t=Ri(a);const n=Ri(a);a=2*(n>>31)+1;const i=n>>>20&2047;return t=4294967296*(1048575&n)+t,Te(e,s,i==2047?t?NaN:a*(1/0):i==0?5e-324*a*t:a*Math.pow(2,i-1075)*(t+4503599627370496)),!0},function(t,e,s){(e=Zt(e))!=null&&(Je(t,s,1),t=t.g,(s=qd||(qd=new DataView(new ArrayBuffer(8)))).setFloat64(0,+e,!0),W=s.getUint32(0,!0),ie=s.getUint32(4,!0),$a(t,W),$a(t,ie))},ct()),ue=Ae(function(t,e,s){return t.h===5&&(Te(e,s,Oi(t.g)),!0)},function(t,e,s){(e=Zt(e))!=null&&(Je(t,s,5),t=t.g,ho(e),$a(t,W))},Oo),m0=ia(yc,function(t,e,s){if((e=na(Zt,e))!=null)for(let o=0;o<e.length;o++){var a=t,n=s,i=e[o];i!=null&&(Je(a,n,5),a=a.g,ho(i),$a(a,W))}},Oo),Uo=ia(yc,function(t,e,s){if((e=na(Zt,e))!=null&&e.length){Je(t,s,2),sa(t.g,4*e.length);for(let a=0;a<e.length;a++)s=t.g,ho(e[a]),$a(s,W)}},Oo),Yt=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Io(t.g,bo)),!0)},fc,nc),di=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Io(t.g,bo))===0?void 0:t),!0)},fc,nc),x0=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Io(t.g,fo)),!0)},function(t,e,s){if((e=Xp(e))!=null&&(typeof e=="string"&&Kr(e),e!=null))switch(Je(t,s,0),typeof e){case"number":t=t.g,Us(e),Ds(t,W,ie);break;case"bigint":s=BigInt.asUintN(64,e),s=new Fi(Number(s&BigInt(4294967295)),Number(s>>BigInt(32))),Ds(t.g,s.h,s.g);break;default:s=Kr(e),Ds(t.g,s.h,s.g)}},ct()),oe=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Kt(t.g)),!0)},bc,Ro),Fn=ia(function(t,e,s){return(t.h===0||t.h===2)&&(e=ta(e,0|e[C],s,!1,!1),t.h==2?_n(t,Kt,e):e.push(Kt(t.g)),!0)},function(t,e,s){if((e=na(Zs,e))!=null&&e.length){s=jo(t,s);for(let a=0;a<e.length;a++)jn(t.g,e[a]);Po(t,s)}},Ro),_s=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Kt(t.g))===0?void 0:t),!0)},bc,Ro),te=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Mo(t.g)),!0)},mc,sc),qs=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Mo(t.g))===!1?void 0:t),!0)},mc,sc),ke=ia(function(t,e,s){return t.h===2&&(t=_o(t),ta(e,0|e[C],s,!1).push(t),!0)},function(t,e,s){if((e=na(Vs,e))!=null)for(let o=0;o<e.length;o++){var a=t,n=s,i=e[o];i!=null&&Pn(a,n,Ed(i))}},qo),Wt=Ae(function(t,e,s){return t.h===2&&(Te(e,s,(t=_o(t))===""?void 0:t),!0)},xc,qo),G=Ae(function(t,e,s){return t.h===2&&(Te(e,s,_o(t)),!0)},xc,qo),me=function(t,e,s=Do){return new aa(t,e,s)}(function(t,e,s,a,n){return t.h===2&&(a=Qt(void 0,a,!0),ta(e,0|e[C],s,!0).push(a),Ia(t,a,n),!0)},function(t,e,s,a,n){if(Array.isArray(e))for(let i=0;i<e.length;i++)gc(t,e[i],s,a,n)}),J=Dn(function(t,e,s,a,n,i){return t.h===2&&(Jd(e,0|e[C],i,s),Ia(t,e=To(e,a,s),n),!0)},gc),wc=Ae(function(t,e,s){return t.h===2&&(Te(e,s,ec(t)),!0)},vc,ic),g0=ia(function(t,e,s){return(t.h===0||t.h===2)&&(e=ta(e,0|e[C],s,!1,!1),t.h==2?_n(t,Dt,e):e.push(Dt(t.g)),!0)},function(t,e,s){if((e=na(Od,e))!=null)for(let o=0;o<e.length;o++){var a=t,n=s,i=e[o];i!=null&&(Je(a,n,0),sa(a.g,i))}},ac),v0=Ae(function(t,e,s){return t.h===0&&(Te(e,s,(t=Dt(t.g))===0?void 0:t),!0)},function(t,e,s){(e=Od(e))!=null&&e!=null&&(Je(t,s,0),sa(t.g,e))},ac),nt=Ae(function(t,e,s){return t.h===0&&(Te(e,s,Kt(t.g)),!0)},function(t,e,s){(e=Zs(e))!=null&&(e=parseInt(e,10),Je(t,s,0),jn(t.g,e))},oc);class y0{constructor(e,s){this.h=e,this.g=s,this.l=H,this.m=I,this.defaultValue=void 0}}function ut(t,e){return new y0(t,e)}function es(t,e){return(s,a)=>{if(Fa.length){const i=Fa.pop();i.o(a),li(i.g,s,a),s=i}else s=new class{constructor(i,o){if(zr.length){const r=zr.pop();li(r,i,o),i=r}else i=new class{constructor(r,l){this.h=null,this.m=!1,this.g=this.l=this.j=0,li(this,r,l)}clear(){this.h=null,this.m=!1,this.g=this.l=this.j=0,this.ba=!1}}(i,o);this.g=i,this.l=this.g.g,this.h=this.m=-1,this.o(o)}o({fa:i=!1}={}){this.fa=i}}(s,a);try{const i=new t,o=i.u;Ho(e)(o,s);var n=i}finally{s.g.clear(),s.m=-1,s.h=-1,Fa.length<100&&Fa.push(s)}return n}}function Bn(t){return function(){const e=new class{constructor(){this.l=[],this.h=0,this.g=new class{constructor(){this.g=[]}length(){return this.g.length}end(){const o=this.g;return this.g=[],o}}}};hc(this.u,e,vs(qn,Rn,On,t)),Js(e,e.g.end());const s=new Uint8Array(e.h),a=e.l,n=a.length;let i=0;for(let o=0;o<n;o++){const r=a[o];s.set(r,i),i+=r.length}return e.l=[s],s}}var tl=class extends ${constructor(t){super(t)}},sl=[0,Wt,Ae(function(t,e,s){return t.h===2&&(Te(e,s,(t=ec(t))===gs()?void 0:t),!0)},function(t,e,s){if(e!=null){if(e instanceof $){const a=e.Ra;return void(a&&(e=a(e),e!=null&&Pn(t,s,Lo(e).buffer)))}if(Array.isArray(e))return}vc(t,e,s)},ic)];let ci,al=globalThis.trustedTypes;function nl(t){ci===void 0&&(ci=function(){let s=null;if(!al)return s;try{const a=n=>n;s=al.createPolicy("goog#html",{createHTML:a,createScript:a,createScriptURL:a})}catch{}return s}());var e=ci;return new class{constructor(s){this.g=s}toString(){return this.g+""}}(e?e.createScriptURL(t):t)}function w0(t,...e){if(e.length===0)return nl(t[0]);let s=t[0];for(let a=0;a<e.length;a++)s+=encodeURIComponent(e[a])+t[a+1];return nl(s)}var Sc=[0,oe,nt,te,-1,Fn,nt,-1],S0=class extends ${constructor(t){super(t)}},kc=[0,te,G,te,nt,-1,ia(function(t,e,s){return(t.h===0||t.h===2)&&(e=ta(e,0|e[C],s,!1,!1),t.h==2?_n(t,l0,e):e.push(Kt(t.g)),!0)},function(t,e,s){if((e=na(Zs,e))!=null&&e.length){s=jo(t,s);for(let a=0;a<e.length;a++)jn(t.g,e[a]);Po(t,s)}},oc),G,-1,[0,te,-1],nt,te,-1],$c=[0,G,-2],il=class extends ${constructor(t){super(t)}},Ec=[0],Ac=[0,oe,te,1,te,-3],Ge=class extends ${constructor(t){super(t,2)}},pe={};pe[336783863]=[0,G,te,-1,oe,[0,[1,2,3,4,5,6,7,8],J,Ec,J,kc,J,$c,J,Ac,J,Sc,J,[0,G,-2],J,[0,G,nt],J,[0,nt,G]],[0,G],te,[0,[1,3],[2,4],J,[0,Fn],-1,J,[0,ke],-1,me,[0,G,-1]],G];var ol=[0,di,-1,qs,-3,di,Fn,Wt,_s,di,-1,qs,_s,qs,-2,Wt];function We(t,e){qi(t,2,ea(e),"")}function K(t,e){Mn(t,3,e)}function F(t,e){Mn(t,4,e)}var Ee=class extends ${constructor(t){super(t,500)}o(t){return I(this,0,7,t)}},xa=[-1,{}],rl=[0,G,1,xa],ll=[0,G,ke,xa];function Qe(t,e){fn(t,1,Ee,e)}function Z(t,e){Mn(t,10,e)}function U(t,e){Mn(t,15,e)}var De=class extends ${constructor(t){super(t,500)}o(t){return I(this,0,1001,t)}},Tc=[-500,me,[-500,Wt,-1,ke,-3,[-2,pe,te],me,sl,_s,-1,rl,ll,me,[0,Wt,qs],Wt,ol,_s,ke,987,ke],4,me,[-500,G,-1,[-1,{}],998,G],me,[-500,G,ke,-1,[-2,{},te],997,ke,-1],_s,me,[-500,G,ke,xa,998,ke],ke,_s,rl,ll,me,[0,Wt,-1,xa],ke,-2,ol,Wt,-1,qs,[0,qs,v0],978,xa,me,sl];De.prototype.g=Bn(Tc);var k0=es(De,Tc),$0=class extends ${constructor(t){super(t)}},Cc=class extends ${constructor(t){super(t)}g(){return Pt(this,$0,1)}},Lc=[0,me,[0,oe,ue,G,-1]],Nn=es(Cc,Lc),E0=class extends ${constructor(t){super(t)}},A0=class extends ${constructor(t){super(t)}},ui=class extends ${constructor(t){super(t)}h(){return H(this,E0,2)}g(){return Pt(this,A0,5)}},Ic=es(class extends ${constructor(t){super(t)}},[0,ke,Fn,Uo,[0,nt,[0,oe,-3],[0,ue,-3],[0,oe,-1,[0,me,[0,oe,-2]]],me,[0,ue,-1,G,ue]],G,-1,Yt,me,[0,oe,ue],ke,Yt]),Mc=class extends ${constructor(t){super(t)}},Rs=es(class extends ${constructor(t){super(t)}},[0,me,[0,ue,-4]]),_c=class extends ${constructor(t){super(t)}},Ma=es(class extends ${constructor(t){super(t)}},[0,me,[0,ue,-4]]),T0=class extends ${constructor(t){super(t)}},C0=[0,oe,-1,Uo,nt],jc=class extends ${constructor(t){super(t)}};jc.prototype.g=Bn([0,ue,-4,Yt]);var L0=class extends ${constructor(t){super(t)}},I0=es(class extends ${constructor(t){super(t)}},[0,me,[0,1,oe,G,Lc],Yt]),dl=class extends ${constructor(t){super(t)}},M0=class extends ${constructor(t){super(t)}oa(){const t=Vd(this);return t??gs()}},_0=class extends ${constructor(t){super(t)}},Pc=[1,2],j0=es(class extends ${constructor(t){super(t)}},[0,me,[0,Pc,J,[0,Uo],J,[0,wc],oe,G],Yt]),Vo=class extends ${constructor(t){super(t)}},Dc=[0,G,oe,ue,ke,-1],cl=class extends ${constructor(t){super(t)}},P0=[0,te,-1],ul=class extends ${constructor(t){super(t)}},en=[1,2,3,4,5],xn=class extends ${constructor(t){super(t)}g(){return Vd(this)!=null}h(){return at(this,2)!=null}},se=class extends ${constructor(t){super(t)}g(){return Rd(Gs(this,2))??!1}},qc=[0,wc,G,[0,oe,Yt,-1],[0,x0,Yt]],le=[0,qc,te,[0,en,J,Ac,J,kc,J,Sc,J,Ec,J,$c],nt],Hn=class extends ${constructor(t){super(t)}},Go=[0,le,ue,-1,oe],D0=ut(502141897,Hn);pe[502141897]=Go;var q0=es(class extends ${constructor(t){super(t)}},[0,[0,nt,-1,m0,g0],C0]),Rc=class extends ${constructor(t){super(t)}},Oc=class extends ${constructor(t){super(t)}},Jo=[0,le,ue,[0,le],te],Fc=[0,le,Go,Jo,ue,[0,[0,qc]]],R0=ut(508968150,Oc);pe[508968150]=Fc,pe[508968149]=Jo;var Bc=class extends ${constructor(t){super(t)}},O0=ut(513916220,Bc);pe[513916220]=[0,le,Fc,oe];var $s=class extends ${constructor(t){super(t)}h(){return H(this,Vo,2)}g(){z(this,2)}},Nc=[0,le,Dc];pe[478825465]=Nc;var F0=class extends ${constructor(t){super(t)}},Hc=class extends ${constructor(t){super(t)}},Wo=class extends ${constructor(t){super(t)}},Qo=class extends ${constructor(t){super(t)}},Uc=class extends ${constructor(t){super(t)}},pl=[0,le,[0,le],Nc,-1],Vc=[0,le,ue,oe],zo=[0,le,ue],Gc=[0,le,Vc,zo,ue],B0=ut(479097054,Uc);pe[479097054]=[0,le,Gc,pl],pe[463370452]=pl,pe[464864288]=Vc;var N0=ut(462713202,Qo);pe[462713202]=Gc,pe[474472470]=zo;var H0=class extends ${constructor(t){super(t)}},Jc=class extends ${constructor(t){super(t)}},Wc=class extends ${constructor(t){super(t)}},Qc=class extends ${constructor(t){super(t)}},Ko=[0,le,ue,-1,oe],Ni=[0,le,ue,te];Qc.prototype.g=Bn([0,le,zo,[0,le],Go,Jo,Ko,Ni]);var zc=class extends ${constructor(t){super(t)}},U0=ut(456383383,zc);pe[456383383]=[0,le,Dc];var Kc=class extends ${constructor(t){super(t)}},V0=ut(476348187,Kc);pe[476348187]=[0,le,P0];var Yc=class extends ${constructor(t){super(t)}},hl=class extends ${constructor(t){super(t)}},Xc=[0,nt,-1],G0=ut(458105876,class extends ${constructor(t){super(t)}g(){var t=this.u;const e=0|t[C],s=2&e;return t=function(a,n,i){var o=hl;const r=2&n;let l=!1;if(i==null){if(r)return Qr();i=[]}else if(i.constructor===st){if(!(2&i.L)||r)return i;i=i.X()}else Array.isArray(i)?l=!!(2&(0|i[C])):i=[];if(r){if(!i.length)return Qr();l||(l=!0,Xs(i))}else l&&(l=!1,i=Gd(i));return l||(64&(0|i[C])?i[C]&=-33:32&n&&kn(i,32)),ae(a,n,2,o=new st(i,o,Zp,void 0)),o}(t,e,qt(t,e,2)),!s&&hl&&(t.ra=!0),t}});pe[458105876]=[0,Xc,b0,[!0,Yt,[0,G,-1,ke]]];var Yo=class extends ${constructor(t){super(t)}},Zc=ut(458105758,Yo);pe[458105758]=[0,le,G,Xc];var eu=class extends ${constructor(t){super(t)}},J0=ut(443442058,eu);pe[443442058]=[0,le,G,oe,ue,ke,-1,te,ue],pe[514774813]=Ko;var tu=class extends ${constructor(t){super(t)}},W0=ut(516587230,tu);function Hi(t,e){return e=e?e.clone():new Vo,t.displayNamesLocale!==void 0?z(e,1,ea(t.displayNamesLocale)):t.displayNamesLocale===void 0&&z(e,1),t.maxResults!==void 0?wt(e,2,t.maxResults):"maxResults"in t&&z(e,2),t.scoreThreshold!==void 0?A(e,3,t.scoreThreshold):"scoreThreshold"in t&&z(e,3),t.categoryAllowlist!==void 0?bn(e,4,t.categoryAllowlist):"categoryAllowlist"in t&&z(e,4),t.categoryDenylist!==void 0?bn(e,5,t.categoryDenylist):"categoryDenylist"in t&&z(e,5),e}function Xo(t,e=-1,s=""){return{categories:t.map(a=>({index:tt(a,1)??0??-1,score:re(a,2)??0,categoryName:at(a,3)??""??"",displayName:at(a,4)??""??""})),headIndex:e,headName:s}}function su(t){var o,r;var e=us(t,3,Zt,cs()),s=us(t,2,Zs,cs()),a=us(t,1,Vs,cs()),n=us(t,9,Vs,cs());const i={categories:[],keypoints:[]};for(let l=0;l<e.length;l++)i.categories.push({score:e[l],index:s[l]??-1,categoryName:a[l]??"",displayName:n[l]??""});if((e=(o=H(t,ui,4))==null?void 0:o.h())&&(i.boundingBox={originX:tt(e,1)??0,originY:tt(e,2)??0,width:tt(e,3)??0,height:tt(e,4)??0,angle:0}),(r=H(t,ui,4))==null?void 0:r.g().length)for(const l of H(t,ui,4).g())i.keypoints.push({x:Xa(l,1)??0,y:Xa(l,2)??0,score:Xa(l,4)??0,label:at(l,3)??""});return i}function Un(t){const e=[];for(const s of Pt(t,_c,1))e.push({x:re(s,1)??0,y:re(s,2)??0,z:re(s,3)??0,visibility:re(s,4)??0});return e}function ga(t){const e=[];for(const s of Pt(t,Mc,1))e.push({x:re(s,1)??0,y:re(s,2)??0,z:re(s,3)??0,visibility:re(s,4)??0});return e}function fl(t){return Array.from(t,e=>e>127?e-256:e)}function bl(t,e){if(t.length!==e.length)throw Error(`Cannot compute cosine similarity between embeddings of different sizes (${t.length} vs. ${e.length}).`);let s=0,a=0,n=0;for(let i=0;i<t.length;i++)s+=t[i]*e[i],a+=t[i]*t[i],n+=e[i]*e[i];if(a<=0||n<=0)throw Error("Cannot compute cosine similarity on embedding with 0 norm.");return s/Math.sqrt(a*n)}let Ba;pe[516587230]=[0,le,Ko,Ni,ue],pe[518928384]=Ni;const Q0=new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]);async function au(){if(Ba===void 0)try{await WebAssembly.instantiate(Q0),Ba=!0}catch{Ba=!1}return Ba}async function ra(t,e=w0``){const s=await au()?"wasm_internal":"wasm_nosimd_internal";return{wasmLoaderPath:`${e}/${t}_${s}.js`,wasmBinaryPath:`${e}/${t}_${s}.wasm`}}var rs=class{};function nu(){var t=navigator;return typeof OffscreenCanvas<"u"&&(!function(e=navigator){return(e=e.userAgent).includes("Safari")&&!e.includes("Chrome")}(t)||!!((t=t.userAgent.match(/Version\/([\d]+).*Safari/))&&t.length>=1&&Number(t[1])>=17))}async function ml(t){if(typeof importScripts!="function"){const e=document.createElement("script");return e.src=t.toString(),e.crossOrigin="anonymous",new Promise((s,a)=>{e.addEventListener("load",()=>{s()},!1),e.addEventListener("error",n=>{a(n)},!1),document.body.appendChild(e)})}importScripts(t.toString())}function iu(t){return t.videoWidth!==void 0?[t.videoWidth,t.videoHeight]:t.naturalWidth!==void 0?[t.naturalWidth,t.naturalHeight]:t.displayWidth!==void 0?[t.displayWidth,t.displayHeight]:[t.width,t.height]}function T(t,e,s){t.m||console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target"),s(e=t.i.stringToNewUTF8(e)),t.i._free(e)}function xl(t,e,s){if(!t.i.canvas)throw Error("No OpenGL canvas configured.");if(s?t.i._bindTextureToStream(s):t.i._bindTextureToCanvas(),!(s=t.i.canvas.getContext("webgl2")||t.i.canvas.getContext("webgl")))throw Error("Failed to obtain WebGL context from the provided canvas. `getContext()` should only be invoked with `webgl` or `webgl2`.");t.i.gpuOriginForWebTexturesIsBottomLeft&&s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!0),s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,e),t.i.gpuOriginForWebTexturesIsBottomLeft&&s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1);const[a,n]=iu(e);return!t.l||a===t.i.canvas.width&&n===t.i.canvas.height||(t.i.canvas.width=a,t.i.canvas.height=n),[a,n]}function gl(t,e,s){t.m||console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target");const a=new Uint32Array(e.length);for(let n=0;n<e.length;n++)a[n]=t.i.stringToNewUTF8(e[n]);e=t.i._malloc(4*a.length),t.i.HEAPU32.set(a,e>>2),s(e);for(const n of a)t.i._free(n);t.i._free(e)}function bt(t,e,s){t.i.simpleListeners=t.i.simpleListeners||{},t.i.simpleListeners[e]=s}function Ut(t,e,s){let a=[];t.i.simpleListeners=t.i.simpleListeners||{},t.i.simpleListeners[e]=(n,i,o)=>{i?(s(a,o),a=[]):a.push(n)}}rs.forVisionTasks=function(t){return ra("vision",t)},rs.forTextTasks=function(t){return ra("text",t)},rs.forGenAiExperimentalTasks=function(t){return ra("genai_experimental",t)},rs.forGenAiTasks=function(t){return ra("genai",t)},rs.forAudioTasks=function(t){return ra("audio",t)},rs.isSimdSupported=function(){return au()};async function z0(t,e,s,a){return t=await(async(n,i,o,r,l)=>{if(i&&await ml(i),!self.ModuleFactory||o&&(await ml(o),!self.ModuleFactory))throw Error("ModuleFactory not set.");return self.Module&&l&&((i=self.Module).locateFile=l.locateFile,l.mainScriptUrlOrBlob&&(i.mainScriptUrlOrBlob=l.mainScriptUrlOrBlob)),l=await self.ModuleFactory(self.Module||l),self.ModuleFactory=self.Module=void 0,new n(l,r)})(t,s.wasmLoaderPath,s.assetLoaderPath,e,{locateFile:n=>n.endsWith(".wasm")?s.wasmBinaryPath.toString():s.assetBinaryPath&&n.endsWith(".data")?s.assetBinaryPath.toString():n}),await t.o(a),t}function pi(t,e){const s=H(t.baseOptions,xn,1)||new xn;typeof e=="string"?(z(s,2,ea(e)),z(s,1)):e instanceof Uint8Array&&(z(s,1,uo(e,!1)),z(s,2)),I(t.baseOptions,0,1,s)}function vl(t){try{const e=t.G.length;if(e===1)throw Error(t.G[0].message);if(e>1)throw Error("Encountered multiple errors: "+t.G.map(s=>s.message).join(", "))}finally{t.G=[]}}function S(t,e){t.B=Math.max(t.B,e)}function Vn(t,e){t.A=new Ee,We(t.A,"PassThroughCalculator"),K(t.A,"free_memory"),F(t.A,"free_memory_unused_out"),Z(e,"free_memory"),Qe(e,t.A)}function Ws(t,e){K(t.A,e),F(t.A,e+"_unused_out")}function Gn(t){t.g.addBoolToStream(!0,"free_memory",t.B)}var tn=class{constructor(t){this.g=t,this.G=[],this.B=0,this.g.setAutoRenderToScreen(!1)}l(t,e=!0){var s,a,n,i,o,r;if(e){const l=t.baseOptions||{};if((s=t.baseOptions)!=null&&s.modelAssetBuffer&&((a=t.baseOptions)!=null&&a.modelAssetPath))throw Error("Cannot set both baseOptions.modelAssetPath and baseOptions.modelAssetBuffer");if(!((n=H(this.baseOptions,xn,1))!=null&&n.g()||(i=H(this.baseOptions,xn,1))!=null&&i.h()||(o=t.baseOptions)!=null&&o.modelAssetBuffer||(r=t.baseOptions)!=null&&r.modelAssetPath))throw Error("Either baseOptions.modelAssetPath or baseOptions.modelAssetBuffer must be set");if(function(d,c){let u=H(d.baseOptions,ul,3);if(!u){var h=u=new ul,p=new il;ma(h,4,en,p)}"delegate"in c&&(c.delegate==="GPU"?(c=u,h=new S0,ma(c,2,en,h)):(c=u,h=new il,ma(c,4,en,h))),I(d.baseOptions,0,3,u)}(this,l),l.modelAssetPath)return fetch(l.modelAssetPath.toString()).then(d=>{if(d.ok)return d.arrayBuffer();throw Error(`Failed to fetch model: ${l.modelAssetPath} (${d.status})`)}).then(d=>{try{this.g.i.FS_unlink("/model.dat")}catch{}this.g.i.FS_createDataFile("/","model.dat",new Uint8Array(d),!0,!1,!1),pi(this,"/model.dat"),this.m(),this.I()});if(l.modelAssetBuffer instanceof Uint8Array)pi(this,l.modelAssetBuffer);else if(l.modelAssetBuffer)return async function(d){const c=[];for(var u=0;;){const{done:h,value:p}=await d.read();if(h)break;c.push(p),u+=p.length}if(c.length===0)return new Uint8Array(0);if(c.length===1)return c[0];d=new Uint8Array(u),u=0;for(const h of c)d.set(h,u),u+=h.length;return d}(l.modelAssetBuffer).then(d=>{pi(this,d),this.m(),this.I()})}return this.m(),this.I(),Promise.resolve()}I(){}da(){let t;if(this.g.da(e=>{t=k0(e)}),!t)throw Error("Failed to retrieve CalculatorGraphConfig");return t}setGraph(t,e){this.g.attachErrorListener((s,a)=>{this.G.push(Error(a))}),this.g.La(),this.g.setGraph(t,e),this.A=void 0,vl(this)}finishProcessing(){this.g.finishProcessing(),vl(this)}close(){this.A=void 0,this.g.closeGraph()}};function _t(t,e){if(!t)throw Error(`Unable to obtain required WebGL resource: ${e}`);return t}tn.prototype.close=tn.prototype.close,function(t,e){t=t.split(".");var s,a=xs;for((t[0]in a)||a.execScript===void 0||a.execScript("var "+t[0]);t.length&&(s=t.shift());)t.length||e===void 0?a=a[s]&&a[s]!==Object.prototype[s]?a[s]:a[s]={}:a[s]=e}("TaskRunner",tn);class K0{constructor(e,s,a,n){this.g=e,this.h=s,this.m=a,this.l=n}bind(){this.g.bindVertexArray(this.h)}close(){this.g.deleteVertexArray(this.h),this.g.deleteBuffer(this.m),this.g.deleteBuffer(this.l)}}function yl(t,e,s){const a=t.g;if(s=_t(a.createShader(s),"Failed to create WebGL shader"),a.shaderSource(s,e),a.compileShader(s),!a.getShaderParameter(s,a.COMPILE_STATUS))throw Error(`Could not compile WebGL shader: ${a.getShaderInfoLog(s)}`);return a.attachShader(t.h,s),s}function wl(t,e){const s=t.g,a=_t(s.createVertexArray(),"Failed to create vertex array");s.bindVertexArray(a);const n=_t(s.createBuffer(),"Failed to create buffer");s.bindBuffer(s.ARRAY_BUFFER,n),s.enableVertexAttribArray(t.O),s.vertexAttribPointer(t.O,2,s.FLOAT,!1,0,0),s.bufferData(s.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),s.STATIC_DRAW);const i=_t(s.createBuffer(),"Failed to create buffer");return s.bindBuffer(s.ARRAY_BUFFER,i),s.enableVertexAttribArray(t.I),s.vertexAttribPointer(t.I,2,s.FLOAT,!1,0,0),s.bufferData(s.ARRAY_BUFFER,new Float32Array(e?[0,1,0,0,1,0,1,1]:[0,0,0,1,1,1,1,0]),s.STATIC_DRAW),s.bindBuffer(s.ARRAY_BUFFER,null),s.bindVertexArray(null),new K0(s,a,n,i)}function Zo(t,e){if(t.g){if(e!==t.g)throw Error("Cannot change GL context once initialized")}else t.g=e}function er(t,e,s,a){return Zo(t,e),t.h||(t.m(),t.C()),s?(t.s||(t.s=wl(t,!0)),s=t.s):(t.v||(t.v=wl(t,!1)),s=t.v),e.useProgram(t.h),s.bind(),t.l(),t=a(),s.g.bindVertexArray(null),t}function Jn(t,e,s){return Zo(t,e),t=_t(e.createTexture(),"Failed to create texture"),e.bindTexture(e.TEXTURE_2D,t),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,s??e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,s??e.LINEAR),e.bindTexture(e.TEXTURE_2D,null),t}function Wn(t,e,s){Zo(t,e),t.A||(t.A=_t(e.createFramebuffer(),"Failed to create framebuffe.")),e.bindFramebuffer(e.FRAMEBUFFER,t.A),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,s,0)}function tr(t){var e;(e=t.g)==null||e.bindFramebuffer(t.g.FRAMEBUFFER,null)}var sr=class{G(){return`
  precision mediump float;
  varying vec2 vTex;
  uniform sampler2D inputTexture;
  void main() {
    gl_FragColor = texture2D(inputTexture, vTex);
  }
 `}m(){const t=this.g;if(this.h=_t(t.createProgram(),"Failed to create WebGL program"),this.aa=yl(this,`
  attribute vec2 aVertex;
  attribute vec2 aTex;
  varying vec2 vTex;
  void main(void) {
    gl_Position = vec4(aVertex, 0.0, 1.0);
    vTex = aTex;
  }`,t.VERTEX_SHADER),this.Z=yl(this,this.G(),t.FRAGMENT_SHADER),t.linkProgram(this.h),!t.getProgramParameter(this.h,t.LINK_STATUS))throw Error(`Error during program linking: ${t.getProgramInfoLog(this.h)}`);this.O=t.getAttribLocation(this.h,"aVertex"),this.I=t.getAttribLocation(this.h,"aTex")}C(){}l(){}close(){if(this.h){const t=this.g;t.deleteProgram(this.h),t.deleteShader(this.aa),t.deleteShader(this.Z)}this.A&&this.g.deleteFramebuffer(this.A),this.v&&this.v.close(),this.s&&this.s.close()}};function Ct(t,e){switch(e){case 0:return t.g.find(s=>s instanceof Uint8Array);case 1:return t.g.find(s=>s instanceof Float32Array);case 2:return t.g.find(s=>typeof WebGLTexture<"u"&&s instanceof WebGLTexture);default:throw Error(`Type is not supported: ${e}`)}}function Ui(t){var e=Ct(t,1);if(!e){if(e=Ct(t,0))e=new Float32Array(e).map(a=>a/255);else{e=new Float32Array(t.width*t.height);const a=Qs(t);var s=ar(t);if(Wn(s,a,ou(t)),"iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"document"in self&&"ontouchend"in self.document){s=new Float32Array(t.width*t.height*4),a.readPixels(0,0,t.width,t.height,a.RGBA,a.FLOAT,s);for(let n=0,i=0;n<e.length;++n,i+=4)e[n]=s[i]}else a.readPixels(0,0,t.width,t.height,a.RED,a.FLOAT,e)}t.g.push(e)}return e}function ou(t){let e=Ct(t,2);if(!e){const s=Qs(t);e=lu(t);const a=Ui(t),n=ru(t);s.texImage2D(s.TEXTURE_2D,0,n,t.width,t.height,0,s.RED,s.FLOAT,a),Vi(t)}return e}function Qs(t){if(!t.canvas)throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");return t.h||(t.h=_t(t.canvas.getContext("webgl2"),"You cannot use a canvas that is already bound to a different type of rendering context.")),t.h}function ru(t){if(t=Qs(t),!Na)if(t.getExtension("EXT_color_buffer_float")&&t.getExtension("OES_texture_float_linear")&&t.getExtension("EXT_float_blend"))Na=t.R32F;else{if(!t.getExtension("EXT_color_buffer_half_float"))throw Error("GPU does not fully support 4-channel float32 or float16 formats");Na=t.R16F}return Na}function ar(t){return t.l||(t.l=new sr),t.l}function lu(t){const e=Qs(t);e.viewport(0,0,t.width,t.height),e.activeTexture(e.TEXTURE0);let s=Ct(t,2);return s||(s=Jn(ar(t),e,t.m?e.LINEAR:e.NEAREST),t.g.push(s),t.j=!0),e.bindTexture(e.TEXTURE_2D,s),s}function Vi(t){t.h.bindTexture(t.h.TEXTURE_2D,null)}var Na,xe=class{constructor(t,e,s,a,n,i,o){this.g=t,this.m=e,this.j=s,this.canvas=a,this.l=n,this.width=i,this.height=o,this.j&&--Sl===0&&console.error("You seem to be creating MPMask instances without invoking .close(). This leaks resources.")}Fa(){return!!Ct(this,0)}ja(){return!!Ct(this,1)}P(){return!!Ct(this,2)}ia(){return(e=Ct(t=this,0))||(e=Ui(t),e=new Uint8Array(e.map(s=>255*s)),t.g.push(e)),e;var t,e}ha(){return Ui(this)}M(){return ou(this)}clone(){const t=[];for(const e of this.g){let s;if(e instanceof Uint8Array)s=new Uint8Array(e);else if(e instanceof Float32Array)s=new Float32Array(e);else{if(!(e instanceof WebGLTexture))throw Error(`Type is not supported: ${e}`);{const a=Qs(this),n=ar(this);a.activeTexture(a.TEXTURE1),s=Jn(n,a,this.m?a.LINEAR:a.NEAREST),a.bindTexture(a.TEXTURE_2D,s);const i=ru(this);a.texImage2D(a.TEXTURE_2D,0,i,this.width,this.height,0,a.RED,a.FLOAT,null),a.bindTexture(a.TEXTURE_2D,null),Wn(n,a,s),er(n,a,!1,()=>{lu(this),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.drawArrays(a.TRIANGLE_FAN,0,4),Vi(this)}),tr(n),Vi(this)}}t.push(s)}return new xe(t,this.m,this.P(),this.canvas,this.l,this.width,this.height)}close(){this.j&&Qs(this).deleteTexture(Ct(this,2)),Sl=-1}};xe.prototype.close=xe.prototype.close,xe.prototype.clone=xe.prototype.clone,xe.prototype.getAsWebGLTexture=xe.prototype.M,xe.prototype.getAsFloat32Array=xe.prototype.ha,xe.prototype.getAsUint8Array=xe.prototype.ia,xe.prototype.hasWebGLTexture=xe.prototype.P,xe.prototype.hasFloat32Array=xe.prototype.ja,xe.prototype.hasUint8Array=xe.prototype.Fa;var Sl=250;function yt(t,e){switch(e){case 0:return t.g.find(s=>s instanceof ImageData);case 1:return t.g.find(s=>typeof ImageBitmap<"u"&&s instanceof ImageBitmap);case 2:return t.g.find(s=>typeof WebGLTexture<"u"&&s instanceof WebGLTexture);default:throw Error(`Type is not supported: ${e}`)}}function du(t){var e=yt(t,0);if(!e){e=zs(t);const s=Qn(t),a=new Uint8Array(t.width*t.height*4);Wn(s,e,sn(t)),e.readPixels(0,0,t.width,t.height,e.RGBA,e.UNSIGNED_BYTE,a),tr(s),e=new ImageData(new Uint8ClampedArray(a.buffer),t.width,t.height),t.g.push(e)}return e}function sn(t){let e=yt(t,2);if(!e){const s=zs(t);e=an(t);const a=yt(t,1)||du(t);s.texImage2D(s.TEXTURE_2D,0,s.RGBA,s.RGBA,s.UNSIGNED_BYTE,a),pa(t)}return e}function zs(t){if(!t.canvas)throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");return t.h||(t.h=_t(t.canvas.getContext("webgl2"),"You cannot use a canvas that is already bound to a different type of rendering context.")),t.h}function Qn(t){return t.l||(t.l=new sr),t.l}function an(t){const e=zs(t);e.viewport(0,0,t.width,t.height),e.activeTexture(e.TEXTURE0);let s=yt(t,2);return s||(s=Jn(Qn(t),e),t.g.push(s),t.m=!0),e.bindTexture(e.TEXTURE_2D,s),s}function pa(t){t.h.bindTexture(t.h.TEXTURE_2D,null)}function kl(t){const e=zs(t);return er(Qn(t),e,!0,()=>function(s,a){const n=s.canvas;if(n.width===s.width&&n.height===s.height)return a();const i=n.width,o=n.height;return n.width=s.width,n.height=s.height,s=a(),n.width=i,n.height=o,s}(t,()=>{if(e.bindFramebuffer(e.FRAMEBUFFER,null),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLE_FAN,0,4),!(t.canvas instanceof OffscreenCanvas))throw Error("Conversion to ImageBitmap requires that the MediaPipe Tasks is initialized with an OffscreenCanvas");return t.canvas.transferToImageBitmap()}))}var ge=class{constructor(t,e,s,a,n,i,o){this.g=t,this.j=e,this.m=s,this.canvas=a,this.l=n,this.width=i,this.height=o,(this.j||this.m)&&--$l===0&&console.error("You seem to be creating MPImage instances without invoking .close(). This leaks resources.")}Ea(){return!!yt(this,0)}ka(){return!!yt(this,1)}P(){return!!yt(this,2)}Ca(){return du(this)}Ba(){var t=yt(this,1);return t||(sn(this),an(this),t=kl(this),pa(this),this.g.push(t),this.j=!0),t}M(){return sn(this)}clone(){const t=[];for(const e of this.g){let s;if(e instanceof ImageData)s=new ImageData(e.data,this.width,this.height);else if(e instanceof WebGLTexture){const a=zs(this),n=Qn(this);a.activeTexture(a.TEXTURE1),s=Jn(n,a),a.bindTexture(a.TEXTURE_2D,s),a.texImage2D(a.TEXTURE_2D,0,a.RGBA,this.width,this.height,0,a.RGBA,a.UNSIGNED_BYTE,null),a.bindTexture(a.TEXTURE_2D,null),Wn(n,a,s),er(n,a,!1,()=>{an(this),a.clearColor(0,0,0,0),a.clear(a.COLOR_BUFFER_BIT),a.drawArrays(a.TRIANGLE_FAN,0,4),pa(this)}),tr(n),pa(this)}else{if(!(e instanceof ImageBitmap))throw Error(`Type is not supported: ${e}`);sn(this),an(this),s=kl(this),pa(this)}t.push(s)}return new ge(t,this.ka(),this.P(),this.canvas,this.l,this.width,this.height)}close(){this.j&&yt(this,1).close(),this.m&&zs(this).deleteTexture(yt(this,2)),$l=-1}};ge.prototype.close=ge.prototype.close,ge.prototype.clone=ge.prototype.clone,ge.prototype.getAsWebGLTexture=ge.prototype.M,ge.prototype.getAsImageBitmap=ge.prototype.Ba,ge.prototype.getAsImageData=ge.prototype.Ca,ge.prototype.hasWebGLTexture=ge.prototype.P,ge.prototype.hasImageBitmap=ge.prototype.ka,ge.prototype.hasImageData=ge.prototype.Ea;var $l=250;function pt(...t){return t.map(([e,s])=>({start:e,end:s}))}const Y0=function(t){return class extends t{La(){this.i._registerModelResourcesGraphService()}}}((El=class{constructor(t,e){this.l=!0,this.i=t,this.g=null,this.h=0,this.m=typeof this.i._addIntToInputStream=="function",e!==void 0?this.i.canvas=e:nu()?this.i.canvas=new OffscreenCanvas(1,1):(console.warn("OffscreenCanvas not supported and GraphRunner constructor glCanvas parameter is undefined. Creating backup canvas."),this.i.canvas=document.createElement("canvas"))}async initializeGraph(t){const e=await(await fetch(t)).arrayBuffer();t=!(t.endsWith(".pbtxt")||t.endsWith(".textproto")),this.setGraph(new Uint8Array(e),t)}setGraphFromString(t){this.setGraph(new TextEncoder().encode(t),!1)}setGraph(t,e){const s=t.length,a=this.i._malloc(s);this.i.HEAPU8.set(t,a),e?this.i._changeBinaryGraph(s,a):this.i._changeTextGraph(s,a),this.i._free(a)}configureAudio(t,e,s,a,n){this.i._configureAudio||console.warn('Attempting to use configureAudio without support for input audio. Is build dep ":gl_graph_runner_audio" missing?'),T(this,a||"input_audio",i=>{T(this,n=n||"audio_header",o=>{this.i._configureAudio(i,o,t,e??0,s)})})}setAutoResizeCanvas(t){this.l=t}setAutoRenderToScreen(t){this.i._setAutoRenderToScreen(t)}setGpuBufferVerticalFlip(t){this.i.gpuOriginForWebTexturesIsBottomLeft=t}da(t){bt(this,"__graph_config__",e=>{t(e)}),T(this,"__graph_config__",e=>{this.i._getGraphConfig(e,void 0)}),delete this.i.simpleListeners.__graph_config__}attachErrorListener(t){this.i.errorListener=t}attachEmptyPacketListener(t,e){this.i.emptyPacketListeners=this.i.emptyPacketListeners||{},this.i.emptyPacketListeners[t]=e}addAudioToStream(t,e,s){this.addAudioToStreamWithShape(t,0,0,e,s)}addAudioToStreamWithShape(t,e,s,a,n){const i=4*t.length;this.h!==i&&(this.g&&this.i._free(this.g),this.g=this.i._malloc(i),this.h=i),this.i.HEAPF32.set(t,this.g/4),T(this,a,o=>{this.i._addAudioToInputStream(this.g,e,s,o,n)})}addGpuBufferToStream(t,e,s){T(this,e,a=>{const[n,i]=xl(this,t,a);this.i._addBoundTextureToStream(a,n,i,s)})}addBoolToStream(t,e,s){T(this,e,a=>{this.i._addBoolToInputStream(t,a,s)})}addDoubleToStream(t,e,s){T(this,e,a=>{this.i._addDoubleToInputStream(t,a,s)})}addFloatToStream(t,e,s){T(this,e,a=>{this.i._addFloatToInputStream(t,a,s)})}addIntToStream(t,e,s){T(this,e,a=>{this.i._addIntToInputStream(t,a,s)})}addUintToStream(t,e,s){T(this,e,a=>{this.i._addUintToInputStream(t,a,s)})}addStringToStream(t,e,s){T(this,e,a=>{T(this,t,n=>{this.i._addStringToInputStream(n,a,s)})})}addStringRecordToStream(t,e,s){T(this,e,a=>{gl(this,Object.keys(t),n=>{gl(this,Object.values(t),i=>{this.i._addFlatHashMapToInputStream(n,i,Object.keys(t).length,a,s)})})})}addProtoToStream(t,e,s,a){T(this,s,n=>{T(this,e,i=>{const o=this.i._malloc(t.length);this.i.HEAPU8.set(t,o),this.i._addProtoToInputStream(o,t.length,i,n,a),this.i._free(o)})})}addEmptyPacketToStream(t,e){T(this,t,s=>{this.i._addEmptyPacketToInputStream(s,e)})}addBoolVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateBoolVector(t.length);if(!n)throw Error("Unable to allocate new bool vector on heap.");for(const i of t)this.i._addBoolVectorEntry(n,i);this.i._addBoolVectorToInputStream(n,a,s)})}addDoubleVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateDoubleVector(t.length);if(!n)throw Error("Unable to allocate new double vector on heap.");for(const i of t)this.i._addDoubleVectorEntry(n,i);this.i._addDoubleVectorToInputStream(n,a,s)})}addFloatVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateFloatVector(t.length);if(!n)throw Error("Unable to allocate new float vector on heap.");for(const i of t)this.i._addFloatVectorEntry(n,i);this.i._addFloatVectorToInputStream(n,a,s)})}addIntVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateIntVector(t.length);if(!n)throw Error("Unable to allocate new int vector on heap.");for(const i of t)this.i._addIntVectorEntry(n,i);this.i._addIntVectorToInputStream(n,a,s)})}addUintVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateUintVector(t.length);if(!n)throw Error("Unable to allocate new unsigned int vector on heap.");for(const i of t)this.i._addUintVectorEntry(n,i);this.i._addUintVectorToInputStream(n,a,s)})}addStringVectorToStream(t,e,s){T(this,e,a=>{const n=this.i._allocateStringVector(t.length);if(!n)throw Error("Unable to allocate new string vector on heap.");for(const i of t)T(this,i,o=>{this.i._addStringVectorEntry(n,o)});this.i._addStringVectorToInputStream(n,a,s)})}addBoolToInputSidePacket(t,e){T(this,e,s=>{this.i._addBoolToInputSidePacket(t,s)})}addDoubleToInputSidePacket(t,e){T(this,e,s=>{this.i._addDoubleToInputSidePacket(t,s)})}addFloatToInputSidePacket(t,e){T(this,e,s=>{this.i._addFloatToInputSidePacket(t,s)})}addIntToInputSidePacket(t,e){T(this,e,s=>{this.i._addIntToInputSidePacket(t,s)})}addUintToInputSidePacket(t,e){T(this,e,s=>{this.i._addUintToInputSidePacket(t,s)})}addStringToInputSidePacket(t,e){T(this,e,s=>{T(this,t,a=>{this.i._addStringToInputSidePacket(a,s)})})}addProtoToInputSidePacket(t,e,s){T(this,s,a=>{T(this,e,n=>{const i=this.i._malloc(t.length);this.i.HEAPU8.set(t,i),this.i._addProtoToInputSidePacket(i,t.length,n,a),this.i._free(i)})})}addBoolVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateBoolVector(t.length);if(!a)throw Error("Unable to allocate new bool vector on heap.");for(const n of t)this.i._addBoolVectorEntry(a,n);this.i._addBoolVectorToInputSidePacket(a,s)})}addDoubleVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateDoubleVector(t.length);if(!a)throw Error("Unable to allocate new double vector on heap.");for(const n of t)this.i._addDoubleVectorEntry(a,n);this.i._addDoubleVectorToInputSidePacket(a,s)})}addFloatVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateFloatVector(t.length);if(!a)throw Error("Unable to allocate new float vector on heap.");for(const n of t)this.i._addFloatVectorEntry(a,n);this.i._addFloatVectorToInputSidePacket(a,s)})}addIntVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateIntVector(t.length);if(!a)throw Error("Unable to allocate new int vector on heap.");for(const n of t)this.i._addIntVectorEntry(a,n);this.i._addIntVectorToInputSidePacket(a,s)})}addUintVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateUintVector(t.length);if(!a)throw Error("Unable to allocate new unsigned int vector on heap.");for(const n of t)this.i._addUintVectorEntry(a,n);this.i._addUintVectorToInputSidePacket(a,s)})}addStringVectorToInputSidePacket(t,e){T(this,e,s=>{const a=this.i._allocateStringVector(t.length);if(!a)throw Error("Unable to allocate new string vector on heap.");for(const n of t)T(this,n,i=>{this.i._addStringVectorEntry(a,i)});this.i._addStringVectorToInputSidePacket(a,s)})}attachBoolListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachBoolListener(s)})}attachBoolVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachBoolVectorListener(s)})}attachIntListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachIntListener(s)})}attachIntVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachIntVectorListener(s)})}attachUintListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachUintListener(s)})}attachUintVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachUintVectorListener(s)})}attachDoubleListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachDoubleListener(s)})}attachDoubleVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachDoubleVectorListener(s)})}attachFloatListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachFloatListener(s)})}attachFloatVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachFloatVectorListener(s)})}attachStringListener(t,e){bt(this,t,e),T(this,t,s=>{this.i._attachStringListener(s)})}attachStringVectorListener(t,e){Ut(this,t,e),T(this,t,s=>{this.i._attachStringVectorListener(s)})}attachProtoListener(t,e,s){bt(this,t,e),T(this,t,a=>{this.i._attachProtoListener(a,s||!1)})}attachProtoVectorListener(t,e,s){Ut(this,t,e),T(this,t,a=>{this.i._attachProtoVectorListener(a,s||!1)})}attachAudioListener(t,e,s){this.i._attachAudioListener||console.warn('Attempting to use attachAudioListener without support for output audio. Is build dep ":gl_graph_runner_audio_out" missing?'),bt(this,t,(a,n)=>{a=new Float32Array(a.buffer,a.byteOffset,a.length/4),e(a,n)}),T(this,t,a=>{this.i._attachAudioListener(a,s||!1)})}finishProcessing(){this.i._waitUntilIdle()}closeGraph(){this.i._closeGraph(),this.i.simpleListeners=void 0,this.i.emptyPacketListeners=void 0}},class extends El{get ea(){return this.i}qa(t,e,s){T(this,e,a=>{const[n,i]=xl(this,t,a);this.ea._addBoundTextureAsImageToStream(a,n,i,s)})}U(t,e){bt(this,t,e),T(this,t,s=>{this.ea._attachImageListener(s)})}ca(t,e){Ut(this,t,e),T(this,t,s=>{this.ea._attachImageVectorListener(s)})}}));var El,it=class extends Y0{};async function R(t,e,s){return async function(a,n,i,o){return z0(a,n,i,o)}(t,s.canvas??(nu()?void 0:document.createElement("canvas")),e,s)}function cu(t,e,s,a){if(t.T){const i=new jc;if(s!=null&&s.regionOfInterest){if(!t.pa)throw Error("This task doesn't support region-of-interest.");var n=s.regionOfInterest;if(n.left>=n.right||n.top>=n.bottom)throw Error("Expected RectF with left < right and top < bottom.");if(n.left<0||n.top<0||n.right>1||n.bottom>1)throw Error("Expected RectF values to be in [0,1].");A(i,1,(n.left+n.right)/2),A(i,2,(n.top+n.bottom)/2),A(i,4,n.right-n.left),A(i,3,n.bottom-n.top)}else A(i,1,.5),A(i,2,.5),A(i,4,1),A(i,3,1);if(s!=null&&s.rotationDegrees){if((s==null?void 0:s.rotationDegrees)%90!=0)throw Error("Expected rotation to be a multiple of 90°.");if(A(i,5,-Math.PI*s.rotationDegrees/180),(s==null?void 0:s.rotationDegrees)%180!=0){const[o,r]=iu(e);s=re(i,3)*r/o,n=re(i,4)*o/r,A(i,4,s),A(i,3,n)}}t.g.addProtoToStream(i.g(),"mediapipe.NormalizedRect",t.T,a)}t.g.qa(e,t.aa,a??performance.now()),t.finishProcessing()}function ot(t,e,s){var a;if((a=t.baseOptions)!=null&&a.g())throw Error("Task is not initialized with image mode. 'runningMode' must be set to 'IMAGE'.");cu(t,e,s,t.B+1)}function St(t,e,s,a){var n;if(!((n=t.baseOptions)!=null&&n.g()))throw Error("Task is not initialized with video mode. 'runningMode' must be set to 'VIDEO'.");cu(t,e,s,a)}function Ks(t,e,s,a){var n=e.data;const i=e.width,o=i*(e=e.height);if((n instanceof Uint8Array||n instanceof Float32Array)&&n.length!==o)throw Error("Unsupported channel count: "+n.length/o);return t=new xe([n],s,!1,t.g.i.canvas,t.O,i,e),a?t.clone():t}var Pe=class extends tn{constructor(t,e,s,a){super(t),this.g=t,this.aa=e,this.T=s,this.pa=a,this.O=new sr}l(t,e=!0){if("runningMode"in t&&ka(this.baseOptions,2,!!t.runningMode&&t.runningMode!=="IMAGE"),t.canvas!==void 0&&this.g.i.canvas!==t.canvas)throw Error("You must create a new task to reset the canvas.");return super.l(t,e)}close(){this.O.close(),super.close()}};Pe.prototype.close=Pe.prototype.close;var Ie=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect_in",!1),this.j={detections:[]},I(t=this.h=new Hn,0,1,e=new se),A(this.h,2,.5),A(this.h,3,.3)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return"minDetectionConfidence"in t&&A(this.h,2,t.minDetectionConfidence??.5),"minSuppressionThreshold"in t&&A(this.h,3,t.minSuppressionThreshold??.3),this.l(t)}D(t,e){return this.j={detections:[]},ot(this,t,e),this.j}F(t,e,s){return this.j={detections:[]},St(this,t,s,e),this.j}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect_in"),U(t,"detections");const e=new Ge;dt(e,D0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.face_detector.FaceDetectorGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect_in"),F(s,"DETECTIONS:detections"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("detections",(a,n)=>{for(const i of a)a=Ic(i),this.j.detections.push(su(a));S(this,n)}),this.g.attachEmptyPacketListener("detections",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ie.prototype.detectForVideo=Ie.prototype.F,Ie.prototype.detect=Ie.prototype.D,Ie.prototype.setOptions=Ie.prototype.o,Ie.createFromModelPath=async function(t,e){return R(Ie,t,{baseOptions:{modelAssetPath:e}})},Ie.createFromModelBuffer=function(t,e){return R(Ie,t,{baseOptions:{modelAssetBuffer:e}})},Ie.createFromOptions=function(t,e){return R(Ie,t,e)};var nr=pt([61,146],[146,91],[91,181],[181,84],[84,17],[17,314],[314,405],[405,321],[321,375],[375,291],[61,185],[185,40],[40,39],[39,37],[37,0],[0,267],[267,269],[269,270],[270,409],[409,291],[78,95],[95,88],[88,178],[178,87],[87,14],[14,317],[317,402],[402,318],[318,324],[324,308],[78,191],[191,80],[80,81],[81,82],[82,13],[13,312],[312,311],[311,310],[310,415],[415,308]),ir=pt([263,249],[249,390],[390,373],[373,374],[374,380],[380,381],[381,382],[382,362],[263,466],[466,388],[388,387],[387,386],[386,385],[385,384],[384,398],[398,362]),or=pt([276,283],[283,282],[282,295],[295,285],[300,293],[293,334],[334,296],[296,336]),uu=pt([474,475],[475,476],[476,477],[477,474]),rr=pt([33,7],[7,163],[163,144],[144,145],[145,153],[153,154],[154,155],[155,133],[33,246],[246,161],[161,160],[160,159],[159,158],[158,157],[157,173],[173,133]),lr=pt([46,53],[53,52],[52,65],[65,55],[70,63],[63,105],[105,66],[66,107]),pu=pt([469,470],[470,471],[471,472],[472,469]),dr=pt([10,338],[338,297],[297,332],[332,284],[284,251],[251,389],[389,356],[356,454],[454,323],[323,361],[361,288],[288,397],[397,365],[365,379],[379,378],[378,400],[400,377],[377,152],[152,148],[148,176],[176,149],[149,150],[150,136],[136,172],[172,58],[58,132],[132,93],[93,234],[234,127],[127,162],[162,21],[21,54],[54,103],[103,67],[67,109],[109,10]),hu=[...nr,...ir,...or,...rr,...lr,...dr],fu=pt([127,34],[34,139],[139,127],[11,0],[0,37],[37,11],[232,231],[231,120],[120,232],[72,37],[37,39],[39,72],[128,121],[121,47],[47,128],[232,121],[121,128],[128,232],[104,69],[69,67],[67,104],[175,171],[171,148],[148,175],[118,50],[50,101],[101,118],[73,39],[39,40],[40,73],[9,151],[151,108],[108,9],[48,115],[115,131],[131,48],[194,204],[204,211],[211,194],[74,40],[40,185],[185,74],[80,42],[42,183],[183,80],[40,92],[92,186],[186,40],[230,229],[229,118],[118,230],[202,212],[212,214],[214,202],[83,18],[18,17],[17,83],[76,61],[61,146],[146,76],[160,29],[29,30],[30,160],[56,157],[157,173],[173,56],[106,204],[204,194],[194,106],[135,214],[214,192],[192,135],[203,165],[165,98],[98,203],[21,71],[71,68],[68,21],[51,45],[45,4],[4,51],[144,24],[24,23],[23,144],[77,146],[146,91],[91,77],[205,50],[50,187],[187,205],[201,200],[200,18],[18,201],[91,106],[106,182],[182,91],[90,91],[91,181],[181,90],[85,84],[84,17],[17,85],[206,203],[203,36],[36,206],[148,171],[171,140],[140,148],[92,40],[40,39],[39,92],[193,189],[189,244],[244,193],[159,158],[158,28],[28,159],[247,246],[246,161],[161,247],[236,3],[3,196],[196,236],[54,68],[68,104],[104,54],[193,168],[168,8],[8,193],[117,228],[228,31],[31,117],[189,193],[193,55],[55,189],[98,97],[97,99],[99,98],[126,47],[47,100],[100,126],[166,79],[79,218],[218,166],[155,154],[154,26],[26,155],[209,49],[49,131],[131,209],[135,136],[136,150],[150,135],[47,126],[126,217],[217,47],[223,52],[52,53],[53,223],[45,51],[51,134],[134,45],[211,170],[170,140],[140,211],[67,69],[69,108],[108,67],[43,106],[106,91],[91,43],[230,119],[119,120],[120,230],[226,130],[130,247],[247,226],[63,53],[53,52],[52,63],[238,20],[20,242],[242,238],[46,70],[70,156],[156,46],[78,62],[62,96],[96,78],[46,53],[53,63],[63,46],[143,34],[34,227],[227,143],[123,117],[117,111],[111,123],[44,125],[125,19],[19,44],[236,134],[134,51],[51,236],[216,206],[206,205],[205,216],[154,153],[153,22],[22,154],[39,37],[37,167],[167,39],[200,201],[201,208],[208,200],[36,142],[142,100],[100,36],[57,212],[212,202],[202,57],[20,60],[60,99],[99,20],[28,158],[158,157],[157,28],[35,226],[226,113],[113,35],[160,159],[159,27],[27,160],[204,202],[202,210],[210,204],[113,225],[225,46],[46,113],[43,202],[202,204],[204,43],[62,76],[76,77],[77,62],[137,123],[123,116],[116,137],[41,38],[38,72],[72,41],[203,129],[129,142],[142,203],[64,98],[98,240],[240,64],[49,102],[102,64],[64,49],[41,73],[73,74],[74,41],[212,216],[216,207],[207,212],[42,74],[74,184],[184,42],[169,170],[170,211],[211,169],[170,149],[149,176],[176,170],[105,66],[66,69],[69,105],[122,6],[6,168],[168,122],[123,147],[147,187],[187,123],[96,77],[77,90],[90,96],[65,55],[55,107],[107,65],[89,90],[90,180],[180,89],[101,100],[100,120],[120,101],[63,105],[105,104],[104,63],[93,137],[137,227],[227,93],[15,86],[86,85],[85,15],[129,102],[102,49],[49,129],[14,87],[87,86],[86,14],[55,8],[8,9],[9,55],[100,47],[47,121],[121,100],[145,23],[23,22],[22,145],[88,89],[89,179],[179,88],[6,122],[122,196],[196,6],[88,95],[95,96],[96,88],[138,172],[172,136],[136,138],[215,58],[58,172],[172,215],[115,48],[48,219],[219,115],[42,80],[80,81],[81,42],[195,3],[3,51],[51,195],[43,146],[146,61],[61,43],[171,175],[175,199],[199,171],[81,82],[82,38],[38,81],[53,46],[46,225],[225,53],[144,163],[163,110],[110,144],[52,65],[65,66],[66,52],[229,228],[228,117],[117,229],[34,127],[127,234],[234,34],[107,108],[108,69],[69,107],[109,108],[108,151],[151,109],[48,64],[64,235],[235,48],[62,78],[78,191],[191,62],[129,209],[209,126],[126,129],[111,35],[35,143],[143,111],[117,123],[123,50],[50,117],[222,65],[65,52],[52,222],[19,125],[125,141],[141,19],[221,55],[55,65],[65,221],[3,195],[195,197],[197,3],[25,7],[7,33],[33,25],[220,237],[237,44],[44,220],[70,71],[71,139],[139,70],[122,193],[193,245],[245,122],[247,130],[130,33],[33,247],[71,21],[21,162],[162,71],[170,169],[169,150],[150,170],[188,174],[174,196],[196,188],[216,186],[186,92],[92,216],[2,97],[97,167],[167,2],[141,125],[125,241],[241,141],[164,167],[167,37],[37,164],[72,38],[38,12],[12,72],[38,82],[82,13],[13,38],[63,68],[68,71],[71,63],[226,35],[35,111],[111,226],[101,50],[50,205],[205,101],[206,92],[92,165],[165,206],[209,198],[198,217],[217,209],[165,167],[167,97],[97,165],[220,115],[115,218],[218,220],[133,112],[112,243],[243,133],[239,238],[238,241],[241,239],[214,135],[135,169],[169,214],[190,173],[173,133],[133,190],[171,208],[208,32],[32,171],[125,44],[44,237],[237,125],[86,87],[87,178],[178,86],[85,86],[86,179],[179,85],[84,85],[85,180],[180,84],[83,84],[84,181],[181,83],[201,83],[83,182],[182,201],[137,93],[93,132],[132,137],[76,62],[62,183],[183,76],[61,76],[76,184],[184,61],[57,61],[61,185],[185,57],[212,57],[57,186],[186,212],[214,207],[207,187],[187,214],[34,143],[143,156],[156,34],[79,239],[239,237],[237,79],[123,137],[137,177],[177,123],[44,1],[1,4],[4,44],[201,194],[194,32],[32,201],[64,102],[102,129],[129,64],[213,215],[215,138],[138,213],[59,166],[166,219],[219,59],[242,99],[99,97],[97,242],[2,94],[94,141],[141,2],[75,59],[59,235],[235,75],[24,110],[110,228],[228,24],[25,130],[130,226],[226,25],[23,24],[24,229],[229,23],[22,23],[23,230],[230,22],[26,22],[22,231],[231,26],[112,26],[26,232],[232,112],[189,190],[190,243],[243,189],[221,56],[56,190],[190,221],[28,56],[56,221],[221,28],[27,28],[28,222],[222,27],[29,27],[27,223],[223,29],[30,29],[29,224],[224,30],[247,30],[30,225],[225,247],[238,79],[79,20],[20,238],[166,59],[59,75],[75,166],[60,75],[75,240],[240,60],[147,177],[177,215],[215,147],[20,79],[79,166],[166,20],[187,147],[147,213],[213,187],[112,233],[233,244],[244,112],[233,128],[128,245],[245,233],[128,114],[114,188],[188,128],[114,217],[217,174],[174,114],[131,115],[115,220],[220,131],[217,198],[198,236],[236,217],[198,131],[131,134],[134,198],[177,132],[132,58],[58,177],[143,35],[35,124],[124,143],[110,163],[163,7],[7,110],[228,110],[110,25],[25,228],[356,389],[389,368],[368,356],[11,302],[302,267],[267,11],[452,350],[350,349],[349,452],[302,303],[303,269],[269,302],[357,343],[343,277],[277,357],[452,453],[453,357],[357,452],[333,332],[332,297],[297,333],[175,152],[152,377],[377,175],[347,348],[348,330],[330,347],[303,304],[304,270],[270,303],[9,336],[336,337],[337,9],[278,279],[279,360],[360,278],[418,262],[262,431],[431,418],[304,408],[408,409],[409,304],[310,415],[415,407],[407,310],[270,409],[409,410],[410,270],[450,348],[348,347],[347,450],[422,430],[430,434],[434,422],[313,314],[314,17],[17,313],[306,307],[307,375],[375,306],[387,388],[388,260],[260,387],[286,414],[414,398],[398,286],[335,406],[406,418],[418,335],[364,367],[367,416],[416,364],[423,358],[358,327],[327,423],[251,284],[284,298],[298,251],[281,5],[5,4],[4,281],[373,374],[374,253],[253,373],[307,320],[320,321],[321,307],[425,427],[427,411],[411,425],[421,313],[313,18],[18,421],[321,405],[405,406],[406,321],[320,404],[404,405],[405,320],[315,16],[16,17],[17,315],[426,425],[425,266],[266,426],[377,400],[400,369],[369,377],[322,391],[391,269],[269,322],[417,465],[465,464],[464,417],[386,257],[257,258],[258,386],[466,260],[260,388],[388,466],[456,399],[399,419],[419,456],[284,332],[332,333],[333,284],[417,285],[285,8],[8,417],[346,340],[340,261],[261,346],[413,441],[441,285],[285,413],[327,460],[460,328],[328,327],[355,371],[371,329],[329,355],[392,439],[439,438],[438,392],[382,341],[341,256],[256,382],[429,420],[420,360],[360,429],[364,394],[394,379],[379,364],[277,343],[343,437],[437,277],[443,444],[444,283],[283,443],[275,440],[440,363],[363,275],[431,262],[262,369],[369,431],[297,338],[338,337],[337,297],[273,375],[375,321],[321,273],[450,451],[451,349],[349,450],[446,342],[342,467],[467,446],[293,334],[334,282],[282,293],[458,461],[461,462],[462,458],[276,353],[353,383],[383,276],[308,324],[324,325],[325,308],[276,300],[300,293],[293,276],[372,345],[345,447],[447,372],[352,345],[345,340],[340,352],[274,1],[1,19],[19,274],[456,248],[248,281],[281,456],[436,427],[427,425],[425,436],[381,256],[256,252],[252,381],[269,391],[391,393],[393,269],[200,199],[199,428],[428,200],[266,330],[330,329],[329,266],[287,273],[273,422],[422,287],[250,462],[462,328],[328,250],[258,286],[286,384],[384,258],[265,353],[353,342],[342,265],[387,259],[259,257],[257,387],[424,431],[431,430],[430,424],[342,353],[353,276],[276,342],[273,335],[335,424],[424,273],[292,325],[325,307],[307,292],[366,447],[447,345],[345,366],[271,303],[303,302],[302,271],[423,266],[266,371],[371,423],[294,455],[455,460],[460,294],[279,278],[278,294],[294,279],[271,272],[272,304],[304,271],[432,434],[434,427],[427,432],[272,407],[407,408],[408,272],[394,430],[430,431],[431,394],[395,369],[369,400],[400,395],[334,333],[333,299],[299,334],[351,417],[417,168],[168,351],[352,280],[280,411],[411,352],[325,319],[319,320],[320,325],[295,296],[296,336],[336,295],[319,403],[403,404],[404,319],[330,348],[348,349],[349,330],[293,298],[298,333],[333,293],[323,454],[454,447],[447,323],[15,16],[16,315],[315,15],[358,429],[429,279],[279,358],[14,15],[15,316],[316,14],[285,336],[336,9],[9,285],[329,349],[349,350],[350,329],[374,380],[380,252],[252,374],[318,402],[402,403],[403,318],[6,197],[197,419],[419,6],[318,319],[319,325],[325,318],[367,364],[364,365],[365,367],[435,367],[367,397],[397,435],[344,438],[438,439],[439,344],[272,271],[271,311],[311,272],[195,5],[5,281],[281,195],[273,287],[287,291],[291,273],[396,428],[428,199],[199,396],[311,271],[271,268],[268,311],[283,444],[444,445],[445,283],[373,254],[254,339],[339,373],[282,334],[334,296],[296,282],[449,347],[347,346],[346,449],[264,447],[447,454],[454,264],[336,296],[296,299],[299,336],[338,10],[10,151],[151,338],[278,439],[439,455],[455,278],[292,407],[407,415],[415,292],[358,371],[371,355],[355,358],[340,345],[345,372],[372,340],[346,347],[347,280],[280,346],[442,443],[443,282],[282,442],[19,94],[94,370],[370,19],[441,442],[442,295],[295,441],[248,419],[419,197],[197,248],[263,255],[255,359],[359,263],[440,275],[275,274],[274,440],[300,383],[383,368],[368,300],[351,412],[412,465],[465,351],[263,467],[467,466],[466,263],[301,368],[368,389],[389,301],[395,378],[378,379],[379,395],[412,351],[351,419],[419,412],[436,426],[426,322],[322,436],[2,164],[164,393],[393,2],[370,462],[462,461],[461,370],[164,0],[0,267],[267,164],[302,11],[11,12],[12,302],[268,12],[12,13],[13,268],[293,300],[300,301],[301,293],[446,261],[261,340],[340,446],[330,266],[266,425],[425,330],[426,423],[423,391],[391,426],[429,355],[355,437],[437,429],[391,327],[327,326],[326,391],[440,457],[457,438],[438,440],[341,382],[382,362],[362,341],[459,457],[457,461],[461,459],[434,430],[430,394],[394,434],[414,463],[463,362],[362,414],[396,369],[369,262],[262,396],[354,461],[461,457],[457,354],[316,403],[403,402],[402,316],[315,404],[404,403],[403,315],[314,405],[405,404],[404,314],[313,406],[406,405],[405,313],[421,418],[418,406],[406,421],[366,401],[401,361],[361,366],[306,408],[408,407],[407,306],[291,409],[409,408],[408,291],[287,410],[410,409],[409,287],[432,436],[436,410],[410,432],[434,416],[416,411],[411,434],[264,368],[368,383],[383,264],[309,438],[438,457],[457,309],[352,376],[376,401],[401,352],[274,275],[275,4],[4,274],[421,428],[428,262],[262,421],[294,327],[327,358],[358,294],[433,416],[416,367],[367,433],[289,455],[455,439],[439,289],[462,370],[370,326],[326,462],[2,326],[326,370],[370,2],[305,460],[460,455],[455,305],[254,449],[449,448],[448,254],[255,261],[261,446],[446,255],[253,450],[450,449],[449,253],[252,451],[451,450],[450,252],[256,452],[452,451],[451,256],[341,453],[453,452],[452,341],[413,464],[464,463],[463,413],[441,413],[413,414],[414,441],[258,442],[442,441],[441,258],[257,443],[443,442],[442,257],[259,444],[444,443],[443,259],[260,445],[445,444],[444,260],[467,342],[342,445],[445,467],[459,458],[458,250],[250,459],[289,392],[392,290],[290,289],[290,328],[328,460],[460,290],[376,433],[433,435],[435,376],[250,290],[290,392],[392,250],[411,416],[416,433],[433,411],[341,463],[463,464],[464,341],[453,464],[464,465],[465,453],[357,465],[465,412],[412,357],[343,412],[412,399],[399,343],[360,363],[363,440],[440,360],[437,399],[399,456],[456,437],[420,456],[456,363],[363,420],[401,435],[435,288],[288,401],[372,383],[383,353],[353,372],[339,255],[255,249],[249,339],[448,261],[261,255],[255,448],[133,243],[243,190],[190,133],[133,155],[155,112],[112,133],[33,246],[246,247],[247,33],[33,130],[130,25],[25,33],[398,384],[384,286],[286,398],[362,398],[398,414],[414,362],[362,463],[463,341],[341,362],[263,359],[359,467],[467,263],[263,249],[249,255],[255,263],[466,467],[467,260],[260,466],[75,60],[60,166],[166,75],[238,239],[239,79],[79,238],[162,127],[127,139],[139,162],[72,11],[11,37],[37,72],[121,232],[232,120],[120,121],[73,72],[72,39],[39,73],[114,128],[128,47],[47,114],[233,232],[232,128],[128,233],[103,104],[104,67],[67,103],[152,175],[175,148],[148,152],[119,118],[118,101],[101,119],[74,73],[73,40],[40,74],[107,9],[9,108],[108,107],[49,48],[48,131],[131,49],[32,194],[194,211],[211,32],[184,74],[74,185],[185,184],[191,80],[80,183],[183,191],[185,40],[40,186],[186,185],[119,230],[230,118],[118,119],[210,202],[202,214],[214,210],[84,83],[83,17],[17,84],[77,76],[76,146],[146,77],[161,160],[160,30],[30,161],[190,56],[56,173],[173,190],[182,106],[106,194],[194,182],[138,135],[135,192],[192,138],[129,203],[203,98],[98,129],[54,21],[21,68],[68,54],[5,51],[51,4],[4,5],[145,144],[144,23],[23,145],[90,77],[77,91],[91,90],[207,205],[205,187],[187,207],[83,201],[201,18],[18,83],[181,91],[91,182],[182,181],[180,90],[90,181],[181,180],[16,85],[85,17],[17,16],[205,206],[206,36],[36,205],[176,148],[148,140],[140,176],[165,92],[92,39],[39,165],[245,193],[193,244],[244,245],[27,159],[159,28],[28,27],[30,247],[247,161],[161,30],[174,236],[236,196],[196,174],[103,54],[54,104],[104,103],[55,193],[193,8],[8,55],[111,117],[117,31],[31,111],[221,189],[189,55],[55,221],[240,98],[98,99],[99,240],[142,126],[126,100],[100,142],[219,166],[166,218],[218,219],[112,155],[155,26],[26,112],[198,209],[209,131],[131,198],[169,135],[135,150],[150,169],[114,47],[47,217],[217,114],[224,223],[223,53],[53,224],[220,45],[45,134],[134,220],[32,211],[211,140],[140,32],[109,67],[67,108],[108,109],[146,43],[43,91],[91,146],[231,230],[230,120],[120,231],[113,226],[226,247],[247,113],[105,63],[63,52],[52,105],[241,238],[238,242],[242,241],[124,46],[46,156],[156,124],[95,78],[78,96],[96,95],[70,46],[46,63],[63,70],[116,143],[143,227],[227,116],[116,123],[123,111],[111,116],[1,44],[44,19],[19,1],[3,236],[236,51],[51,3],[207,216],[216,205],[205,207],[26,154],[154,22],[22,26],[165,39],[39,167],[167,165],[199,200],[200,208],[208,199],[101,36],[36,100],[100,101],[43,57],[57,202],[202,43],[242,20],[20,99],[99,242],[56,28],[28,157],[157,56],[124,35],[35,113],[113,124],[29,160],[160,27],[27,29],[211,204],[204,210],[210,211],[124,113],[113,46],[46,124],[106,43],[43,204],[204,106],[96,62],[62,77],[77,96],[227,137],[137,116],[116,227],[73,41],[41,72],[72,73],[36,203],[203,142],[142,36],[235,64],[64,240],[240,235],[48,49],[49,64],[64,48],[42,41],[41,74],[74,42],[214,212],[212,207],[207,214],[183,42],[42,184],[184,183],[210,169],[169,211],[211,210],[140,170],[170,176],[176,140],[104,105],[105,69],[69,104],[193,122],[122,168],[168,193],[50,123],[123,187],[187,50],[89,96],[96,90],[90,89],[66,65],[65,107],[107,66],[179,89],[89,180],[180,179],[119,101],[101,120],[120,119],[68,63],[63,104],[104,68],[234,93],[93,227],[227,234],[16,15],[15,85],[85,16],[209,129],[129,49],[49,209],[15,14],[14,86],[86,15],[107,55],[55,9],[9,107],[120,100],[100,121],[121,120],[153,145],[145,22],[22,153],[178,88],[88,179],[179,178],[197,6],[6,196],[196,197],[89,88],[88,96],[96,89],[135,138],[138,136],[136,135],[138,215],[215,172],[172,138],[218,115],[115,219],[219,218],[41,42],[42,81],[81,41],[5,195],[195,51],[51,5],[57,43],[43,61],[61,57],[208,171],[171,199],[199,208],[41,81],[81,38],[38,41],[224,53],[53,225],[225,224],[24,144],[144,110],[110,24],[105,52],[52,66],[66,105],[118,229],[229,117],[117,118],[227,34],[34,234],[234,227],[66,107],[107,69],[69,66],[10,109],[109,151],[151,10],[219,48],[48,235],[235,219],[183,62],[62,191],[191,183],[142,129],[129,126],[126,142],[116,111],[111,143],[143,116],[118,117],[117,50],[50,118],[223,222],[222,52],[52,223],[94,19],[19,141],[141,94],[222,221],[221,65],[65,222],[196,3],[3,197],[197,196],[45,220],[220,44],[44,45],[156,70],[70,139],[139,156],[188,122],[122,245],[245,188],[139,71],[71,162],[162,139],[149,170],[170,150],[150,149],[122,188],[188,196],[196,122],[206,216],[216,92],[92,206],[164,2],[2,167],[167,164],[242,141],[141,241],[241,242],[0,164],[164,37],[37,0],[11,72],[72,12],[12,11],[12,38],[38,13],[13,12],[70,63],[63,71],[71,70],[31,226],[226,111],[111,31],[36,101],[101,205],[205,36],[203,206],[206,165],[165,203],[126,209],[209,217],[217,126],[98,165],[165,97],[97,98],[237,220],[220,218],[218,237],[237,239],[239,241],[241,237],[210,214],[214,169],[169,210],[140,171],[171,32],[32,140],[241,125],[125,237],[237,241],[179,86],[86,178],[178,179],[180,85],[85,179],[179,180],[181,84],[84,180],[180,181],[182,83],[83,181],[181,182],[194,201],[201,182],[182,194],[177,137],[137,132],[132,177],[184,76],[76,183],[183,184],[185,61],[61,184],[184,185],[186,57],[57,185],[185,186],[216,212],[212,186],[186,216],[192,214],[214,187],[187,192],[139,34],[34,156],[156,139],[218,79],[79,237],[237,218],[147,123],[123,177],[177,147],[45,44],[44,4],[4,45],[208,201],[201,32],[32,208],[98,64],[64,129],[129,98],[192,213],[213,138],[138,192],[235,59],[59,219],[219,235],[141,242],[242,97],[97,141],[97,2],[2,141],[141,97],[240,75],[75,235],[235,240],[229,24],[24,228],[228,229],[31,25],[25,226],[226,31],[230,23],[23,229],[229,230],[231,22],[22,230],[230,231],[232,26],[26,231],[231,232],[233,112],[112,232],[232,233],[244,189],[189,243],[243,244],[189,221],[221,190],[190,189],[222,28],[28,221],[221,222],[223,27],[27,222],[222,223],[224,29],[29,223],[223,224],[225,30],[30,224],[224,225],[113,247],[247,225],[225,113],[99,60],[60,240],[240,99],[213,147],[147,215],[215,213],[60,20],[20,166],[166,60],[192,187],[187,213],[213,192],[243,112],[112,244],[244,243],[244,233],[233,245],[245,244],[245,128],[128,188],[188,245],[188,114],[114,174],[174,188],[134,131],[131,220],[220,134],[174,217],[217,236],[236,174],[236,198],[198,134],[134,236],[215,177],[177,58],[58,215],[156,143],[143,124],[124,156],[25,110],[110,7],[7,25],[31,228],[228,25],[25,31],[264,356],[356,368],[368,264],[0,11],[11,267],[267,0],[451,452],[452,349],[349,451],[267,302],[302,269],[269,267],[350,357],[357,277],[277,350],[350,452],[452,357],[357,350],[299,333],[333,297],[297,299],[396,175],[175,377],[377,396],[280,347],[347,330],[330,280],[269,303],[303,270],[270,269],[151,9],[9,337],[337,151],[344,278],[278,360],[360,344],[424,418],[418,431],[431,424],[270,304],[304,409],[409,270],[272,310],[310,407],[407,272],[322,270],[270,410],[410,322],[449,450],[450,347],[347,449],[432,422],[422,434],[434,432],[18,313],[313,17],[17,18],[291,306],[306,375],[375,291],[259,387],[387,260],[260,259],[424,335],[335,418],[418,424],[434,364],[364,416],[416,434],[391,423],[423,327],[327,391],[301,251],[251,298],[298,301],[275,281],[281,4],[4,275],[254,373],[373,253],[253,254],[375,307],[307,321],[321,375],[280,425],[425,411],[411,280],[200,421],[421,18],[18,200],[335,321],[321,406],[406,335],[321,320],[320,405],[405,321],[314,315],[315,17],[17,314],[423,426],[426,266],[266,423],[396,377],[377,369],[369,396],[270,322],[322,269],[269,270],[413,417],[417,464],[464,413],[385,386],[386,258],[258,385],[248,456],[456,419],[419,248],[298,284],[284,333],[333,298],[168,417],[417,8],[8,168],[448,346],[346,261],[261,448],[417,413],[413,285],[285,417],[326,327],[327,328],[328,326],[277,355],[355,329],[329,277],[309,392],[392,438],[438,309],[381,382],[382,256],[256,381],[279,429],[429,360],[360,279],[365,364],[364,379],[379,365],[355,277],[277,437],[437,355],[282,443],[443,283],[283,282],[281,275],[275,363],[363,281],[395,431],[431,369],[369,395],[299,297],[297,337],[337,299],[335,273],[273,321],[321,335],[348,450],[450,349],[349,348],[359,446],[446,467],[467,359],[283,293],[293,282],[282,283],[250,458],[458,462],[462,250],[300,276],[276,383],[383,300],[292,308],[308,325],[325,292],[283,276],[276,293],[293,283],[264,372],[372,447],[447,264],[346,352],[352,340],[340,346],[354,274],[274,19],[19,354],[363,456],[456,281],[281,363],[426,436],[436,425],[425,426],[380,381],[381,252],[252,380],[267,269],[269,393],[393,267],[421,200],[200,428],[428,421],[371,266],[266,329],[329,371],[432,287],[287,422],[422,432],[290,250],[250,328],[328,290],[385,258],[258,384],[384,385],[446,265],[265,342],[342,446],[386,387],[387,257],[257,386],[422,424],[424,430],[430,422],[445,342],[342,276],[276,445],[422,273],[273,424],[424,422],[306,292],[292,307],[307,306],[352,366],[366,345],[345,352],[268,271],[271,302],[302,268],[358,423],[423,371],[371,358],[327,294],[294,460],[460,327],[331,279],[279,294],[294,331],[303,271],[271,304],[304,303],[436,432],[432,427],[427,436],[304,272],[272,408],[408,304],[395,394],[394,431],[431,395],[378,395],[395,400],[400,378],[296,334],[334,299],[299,296],[6,351],[351,168],[168,6],[376,352],[352,411],[411,376],[307,325],[325,320],[320,307],[285,295],[295,336],[336,285],[320,319],[319,404],[404,320],[329,330],[330,349],[349,329],[334,293],[293,333],[333,334],[366,323],[323,447],[447,366],[316,15],[15,315],[315,316],[331,358],[358,279],[279,331],[317,14],[14,316],[316,317],[8,285],[285,9],[9,8],[277,329],[329,350],[350,277],[253,374],[374,252],[252,253],[319,318],[318,403],[403,319],[351,6],[6,419],[419,351],[324,318],[318,325],[325,324],[397,367],[367,365],[365,397],[288,435],[435,397],[397,288],[278,344],[344,439],[439,278],[310,272],[272,311],[311,310],[248,195],[195,281],[281,248],[375,273],[273,291],[291,375],[175,396],[396,199],[199,175],[312,311],[311,268],[268,312],[276,283],[283,445],[445,276],[390,373],[373,339],[339,390],[295,282],[282,296],[296,295],[448,449],[449,346],[346,448],[356,264],[264,454],[454,356],[337,336],[336,299],[299,337],[337,338],[338,151],[151,337],[294,278],[278,455],[455,294],[308,292],[292,415],[415,308],[429,358],[358,355],[355,429],[265,340],[340,372],[372,265],[352,346],[346,280],[280,352],[295,442],[442,282],[282,295],[354,19],[19,370],[370,354],[285,441],[441,295],[295,285],[195,248],[248,197],[197,195],[457,440],[440,274],[274,457],[301,300],[300,368],[368,301],[417,351],[351,465],[465,417],[251,301],[301,389],[389,251],[394,395],[395,379],[379,394],[399,412],[412,419],[419,399],[410,436],[436,322],[322,410],[326,2],[2,393],[393,326],[354,370],[370,461],[461,354],[393,164],[164,267],[267,393],[268,302],[302,12],[12,268],[312,268],[268,13],[13,312],[298,293],[293,301],[301,298],[265,446],[446,340],[340,265],[280,330],[330,425],[425,280],[322,426],[426,391],[391,322],[420,429],[429,437],[437,420],[393,391],[391,326],[326,393],[344,440],[440,438],[438,344],[458,459],[459,461],[461,458],[364,434],[434,394],[394,364],[428,396],[396,262],[262,428],[274,354],[354,457],[457,274],[317,316],[316,402],[402,317],[316,315],[315,403],[403,316],[315,314],[314,404],[404,315],[314,313],[313,405],[405,314],[313,421],[421,406],[406,313],[323,366],[366,361],[361,323],[292,306],[306,407],[407,292],[306,291],[291,408],[408,306],[291,287],[287,409],[409,291],[287,432],[432,410],[410,287],[427,434],[434,411],[411,427],[372,264],[264,383],[383,372],[459,309],[309,457],[457,459],[366,352],[352,401],[401,366],[1,274],[274,4],[4,1],[418,421],[421,262],[262,418],[331,294],[294,358],[358,331],[435,433],[433,367],[367,435],[392,289],[289,439],[439,392],[328,462],[462,326],[326,328],[94,2],[2,370],[370,94],[289,305],[305,455],[455,289],[339,254],[254,448],[448,339],[359,255],[255,446],[446,359],[254,253],[253,449],[449,254],[253,252],[252,450],[450,253],[252,256],[256,451],[451,252],[256,341],[341,452],[452,256],[414,413],[413,463],[463,414],[286,441],[441,414],[414,286],[286,258],[258,441],[441,286],[258,257],[257,442],[442,258],[257,259],[259,443],[443,257],[259,260],[260,444],[444,259],[260,467],[467,445],[445,260],[309,459],[459,250],[250,309],[305,289],[289,290],[290,305],[305,290],[290,460],[460,305],[401,376],[376,435],[435,401],[309,250],[250,392],[392,309],[376,411],[411,433],[433,376],[453,341],[341,464],[464,453],[357,453],[453,465],[465,357],[343,357],[357,412],[412,343],[437,343],[343,399],[399,437],[344,360],[360,440],[440,344],[420,437],[437,456],[456,420],[360,420],[420,363],[363,360],[361,401],[401,288],[288,361],[265,372],[372,353],[353,265],[390,339],[339,249],[249,390],[339,448],[448,255],[255,339]);function Al(t){t.j={faceLandmarks:[],faceBlendshapes:[],facialTransformationMatrixes:[]}}var ne=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!1),this.j={faceLandmarks:[],faceBlendshapes:[],facialTransformationMatrixes:[]},this.outputFacialTransformationMatrixes=this.outputFaceBlendshapes=!1,I(t=this.h=new Oc,0,1,e=new se),this.v=new Rc,I(this.h,0,3,this.v),this.s=new Hn,I(this.h,0,2,this.s),wt(this.s,4,1),A(this.s,2,.5),A(this.v,2,.5),A(this.h,4,.5)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return"numFaces"in t&&wt(this.s,4,t.numFaces??1),"minFaceDetectionConfidence"in t&&A(this.s,2,t.minFaceDetectionConfidence??.5),"minTrackingConfidence"in t&&A(this.h,4,t.minTrackingConfidence??.5),"minFacePresenceConfidence"in t&&A(this.v,2,t.minFacePresenceConfidence??.5),"outputFaceBlendshapes"in t&&(this.outputFaceBlendshapes=!!t.outputFaceBlendshapes),"outputFacialTransformationMatrixes"in t&&(this.outputFacialTransformationMatrixes=!!t.outputFacialTransformationMatrixes),this.l(t)}D(t,e){return Al(this),ot(this,t,e),this.j}F(t,e,s){return Al(this),St(this,t,s,e),this.j}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"face_landmarks");const e=new Ge;dt(e,R0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.face_landmarker.FaceLandmarkerGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"NORM_LANDMARKS:face_landmarks"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("face_landmarks",(a,n)=>{for(const i of a)a=Ma(i),this.j.faceLandmarks.push(Un(a));S(this,n)}),this.g.attachEmptyPacketListener("face_landmarks",a=>{S(this,a)}),this.outputFaceBlendshapes&&(U(t,"blendshapes"),F(s,"BLENDSHAPES:blendshapes"),this.g.attachProtoVectorListener("blendshapes",(a,n)=>{if(this.outputFaceBlendshapes)for(const i of a)a=Nn(i),this.j.faceBlendshapes.push(Xo(a.g()??[]));S(this,n)}),this.g.attachEmptyPacketListener("blendshapes",a=>{S(this,a)})),this.outputFacialTransformationMatrixes&&(U(t,"face_geometry"),F(s,"FACE_GEOMETRY:face_geometry"),this.g.attachProtoVectorListener("face_geometry",(a,n)=>{if(this.outputFacialTransformationMatrixes)for(const i of a)(a=H(q0(i),T0,2))&&this.j.facialTransformationMatrixes.push({rows:tt(a,1)??0??0,columns:tt(a,2)??0??0,data:us(a,3,Zt,cs()).slice()??[]});S(this,n)}),this.g.attachEmptyPacketListener("face_geometry",a=>{S(this,a)})),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};ne.prototype.detectForVideo=ne.prototype.F,ne.prototype.detect=ne.prototype.D,ne.prototype.setOptions=ne.prototype.o,ne.createFromModelPath=function(t,e){return R(ne,t,{baseOptions:{modelAssetPath:e}})},ne.createFromModelBuffer=function(t,e){return R(ne,t,{baseOptions:{modelAssetBuffer:e}})},ne.createFromOptions=function(t,e){return R(ne,t,e)},ne.FACE_LANDMARKS_LIPS=nr,ne.FACE_LANDMARKS_LEFT_EYE=ir,ne.FACE_LANDMARKS_LEFT_EYEBROW=or,ne.FACE_LANDMARKS_LEFT_IRIS=uu,ne.FACE_LANDMARKS_RIGHT_EYE=rr,ne.FACE_LANDMARKS_RIGHT_EYEBROW=lr,ne.FACE_LANDMARKS_RIGHT_IRIS=pu,ne.FACE_LANDMARKS_FACE_OVAL=dr,ne.FACE_LANDMARKS_CONTOURS=hu,ne.FACE_LANDMARKS_TESSELATION=fu;var mt=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!0),I(t=this.j=new Bc,0,1,e=new se)}get baseOptions(){return H(this.j,se,1)}set baseOptions(t){I(this.j,0,1,t)}o(t){return super.l(t)}Oa(t,e,s){const a=typeof e!="function"?e:{};if(this.h=typeof e=="function"?e:s,ot(this,t,a??{}),!this.h)return this.s}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"stylized_image");const e=new Ge;dt(e,O0,this.j);const s=new Ee;We(s,"mediapipe.tasks.vision.face_stylizer.FaceStylizerGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"STYLIZED_IMAGE:stylized_image"),s.o(e),Qe(t,s),this.g.U("stylized_image",(a,n)=>{var i=!this.h,o=a.data,r=a.width;const l=r*(a=a.height);if(o instanceof Uint8Array)if(o.length===3*l){const d=new Uint8ClampedArray(4*l);for(let c=0;c<l;++c)d[4*c]=o[3*c],d[4*c+1]=o[3*c+1],d[4*c+2]=o[3*c+2],d[4*c+3]=255;o=new ImageData(d,r,a)}else{if(o.length!==4*l)throw Error("Unsupported channel count: "+o.length/l);o=new ImageData(new Uint8ClampedArray(o.buffer,o.byteOffset,o.length),r,a)}else if(!(o instanceof WebGLTexture))throw Error(`Unsupported format: ${o.constructor.name}`);r=new ge([o],!1,!1,this.g.i.canvas,this.O,r,a),this.s=i=i?r.clone():r,this.h&&this.h(i),S(this,n)}),this.g.attachEmptyPacketListener("stylized_image",a=>{this.s=null,this.h&&this.h(null),S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};mt.prototype.stylize=mt.prototype.Oa,mt.prototype.setOptions=mt.prototype.o,mt.createFromModelPath=function(t,e){return R(mt,t,{baseOptions:{modelAssetPath:e}})},mt.createFromModelBuffer=function(t,e){return R(mt,t,{baseOptions:{modelAssetBuffer:e}})},mt.createFromOptions=function(t,e){return R(mt,t,e)};var cr=pt([0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]);function Tl(t){t.gestures=[],t.landmarks=[],t.worldLandmarks=[],t.handedness=[]}function Cl(t){return t.gestures.length===0?{gestures:[],landmarks:[],worldLandmarks:[],handedness:[],handednesses:[]}:{gestures:t.gestures,landmarks:t.landmarks,worldLandmarks:t.worldLandmarks,handedness:t.handedness,handednesses:t.handedness}}function Ll(t,e=!0){const s=[];for(const n of t){var a=Nn(n);t=[];for(const i of a.g())a=e&&tt(i,1)!=null?tt(i,1)??0:-1,t.push({score:re(i,2)??0,index:a,categoryName:at(i,3)??""??"",displayName:at(i,4)??""??""});s.push(t)}return s}var Fe=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!1),this.gestures=[],this.landmarks=[],this.worldLandmarks=[],this.handedness=[],I(t=this.j=new Uc,0,1,e=new se),this.s=new Qo,I(this.j,0,2,this.s),this.C=new Wo,I(this.s,0,3,this.C),this.v=new Hc,I(this.s,0,2,this.v),this.h=new F0,I(this.j,0,3,this.h),A(this.v,2,.5),A(this.s,4,.5),A(this.C,2,.5)}get baseOptions(){return H(this.j,se,1)}set baseOptions(t){I(this.j,0,1,t)}o(t){var n,i,o,r;if(wt(this.v,3,t.numHands??1),"minHandDetectionConfidence"in t&&A(this.v,2,t.minHandDetectionConfidence??.5),"minTrackingConfidence"in t&&A(this.s,4,t.minTrackingConfidence??.5),"minHandPresenceConfidence"in t&&A(this.C,2,t.minHandPresenceConfidence??.5),t.cannedGesturesClassifierOptions){var e=new $s,s=e,a=Hi(t.cannedGesturesClassifierOptions,(n=H(this.h,$s,3))==null?void 0:n.h());I(s,0,2,a),I(this.h,0,3,e)}else t.cannedGesturesClassifierOptions===void 0&&((i=H(this.h,$s,3))==null||i.g());return t.customGesturesClassifierOptions?(I(s=e=new $s,0,2,a=Hi(t.customGesturesClassifierOptions,(o=H(this.h,$s,4))==null?void 0:o.h())),I(this.h,0,4,e)):t.customGesturesClassifierOptions===void 0&&((r=H(this.h,$s,4))==null||r.g()),this.l(t)}Ja(t,e){return Tl(this),ot(this,t,e),Cl(this)}Ka(t,e,s){return Tl(this),St(this,t,s,e),Cl(this)}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"hand_gestures"),U(t,"hand_landmarks"),U(t,"world_hand_landmarks"),U(t,"handedness");const e=new Ge;dt(e,B0,this.j);const s=new Ee;We(s,"mediapipe.tasks.vision.gesture_recognizer.GestureRecognizerGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"HAND_GESTURES:hand_gestures"),F(s,"LANDMARKS:hand_landmarks"),F(s,"WORLD_LANDMARKS:world_hand_landmarks"),F(s,"HANDEDNESS:handedness"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("hand_landmarks",(a,n)=>{for(const i of a){a=Ma(i);const o=[];for(const r of Pt(a,_c,1))o.push({x:re(r,1)??0,y:re(r,2)??0,z:re(r,3)??0,visibility:re(r,4)??0});this.landmarks.push(o)}S(this,n)}),this.g.attachEmptyPacketListener("hand_landmarks",a=>{S(this,a)}),this.g.attachProtoVectorListener("world_hand_landmarks",(a,n)=>{for(const i of a){a=Rs(i);const o=[];for(const r of Pt(a,Mc,1))o.push({x:re(r,1)??0,y:re(r,2)??0,z:re(r,3)??0,visibility:re(r,4)??0});this.worldLandmarks.push(o)}S(this,n)}),this.g.attachEmptyPacketListener("world_hand_landmarks",a=>{S(this,a)}),this.g.attachProtoVectorListener("hand_gestures",(a,n)=>{this.gestures.push(...Ll(a,!1)),S(this,n)}),this.g.attachEmptyPacketListener("hand_gestures",a=>{S(this,a)}),this.g.attachProtoVectorListener("handedness",(a,n)=>{this.handedness.push(...Ll(a)),S(this,n)}),this.g.attachEmptyPacketListener("handedness",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};function Il(t){return{landmarks:t.landmarks,worldLandmarks:t.worldLandmarks,handednesses:t.handedness,handedness:t.handedness}}Fe.prototype.recognizeForVideo=Fe.prototype.Ka,Fe.prototype.recognize=Fe.prototype.Ja,Fe.prototype.setOptions=Fe.prototype.o,Fe.createFromModelPath=function(t,e){return R(Fe,t,{baseOptions:{modelAssetPath:e}})},Fe.createFromModelBuffer=function(t,e){return R(Fe,t,{baseOptions:{modelAssetBuffer:e}})},Fe.createFromOptions=function(t,e){return R(Fe,t,e)},Fe.HAND_CONNECTIONS=cr;var Be=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!1),this.landmarks=[],this.worldLandmarks=[],this.handedness=[],I(t=this.h=new Qo,0,1,e=new se),this.s=new Wo,I(this.h,0,3,this.s),this.j=new Hc,I(this.h,0,2,this.j),wt(this.j,3,1),A(this.j,2,.5),A(this.s,2,.5),A(this.h,4,.5)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return"numHands"in t&&wt(this.j,3,t.numHands??1),"minHandDetectionConfidence"in t&&A(this.j,2,t.minHandDetectionConfidence??.5),"minTrackingConfidence"in t&&A(this.h,4,t.minTrackingConfidence??.5),"minHandPresenceConfidence"in t&&A(this.s,2,t.minHandPresenceConfidence??.5),this.l(t)}D(t,e){return this.landmarks=[],this.worldLandmarks=[],this.handedness=[],ot(this,t,e),Il(this)}F(t,e,s){return this.landmarks=[],this.worldLandmarks=[],this.handedness=[],St(this,t,s,e),Il(this)}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"hand_landmarks"),U(t,"world_hand_landmarks"),U(t,"handedness");const e=new Ge;dt(e,N0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.hand_landmarker.HandLandmarkerGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"LANDMARKS:hand_landmarks"),F(s,"WORLD_LANDMARKS:world_hand_landmarks"),F(s,"HANDEDNESS:handedness"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("hand_landmarks",(a,n)=>{for(const i of a)a=Ma(i),this.landmarks.push(Un(a));S(this,n)}),this.g.attachEmptyPacketListener("hand_landmarks",a=>{S(this,a)}),this.g.attachProtoVectorListener("world_hand_landmarks",(a,n)=>{for(const i of a)a=Rs(i),this.worldLandmarks.push(ga(a));S(this,n)}),this.g.attachEmptyPacketListener("world_hand_landmarks",a=>{S(this,a)}),this.g.attachProtoVectorListener("handedness",(a,n)=>{var i=this.handedness,o=i.push;const r=[];for(const l of a){a=Nn(l);const d=[];for(const c of a.g())d.push({score:re(c,2)??0,index:tt(c,1)??0??-1,categoryName:at(c,3)??""??"",displayName:at(c,4)??""??""});r.push(d)}o.call(i,...r),S(this,n)}),this.g.attachEmptyPacketListener("handedness",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Be.prototype.detectForVideo=Be.prototype.F,Be.prototype.detect=Be.prototype.D,Be.prototype.setOptions=Be.prototype.o,Be.createFromModelPath=function(t,e){return R(Be,t,{baseOptions:{modelAssetPath:e}})},Be.createFromModelBuffer=function(t,e){return R(Be,t,{baseOptions:{modelAssetBuffer:e}})},Be.createFromOptions=function(t,e){return R(Be,t,e)},Be.HAND_CONNECTIONS=cr;var bu=pt([0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],[11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],[12,14],[14,16],[16,18],[16,20],[16,22],[18,20],[11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],[27,31],[28,32]);function Ml(t){t.h={faceLandmarks:[],faceBlendshapes:[],poseLandmarks:[],poseWorldLandmarks:[],poseSegmentationMasks:[],leftHandLandmarks:[],leftHandWorldLandmarks:[],rightHandLandmarks:[],rightHandWorldLandmarks:[]}}function _l(t){try{if(!t.C)return t.h;t.C(t.h)}finally{Gn(t)}}function Ha(t,e){t=Ma(t),e.push(Un(t))}var ee=class extends Pe{constructor(t,e){super(new it(t,e),"input_frames_image",null,!1),this.h={faceLandmarks:[],faceBlendshapes:[],poseLandmarks:[],poseWorldLandmarks:[],poseSegmentationMasks:[],leftHandLandmarks:[],leftHandWorldLandmarks:[],rightHandLandmarks:[],rightHandWorldLandmarks:[]},this.outputPoseSegmentationMasks=this.outputFaceBlendshapes=!1,I(t=this.j=new Qc,0,1,e=new se),this.J=new Wo,I(this.j,0,2,this.J),this.Z=new H0,I(this.j,0,3,this.Z),this.s=new Hn,I(this.j,0,4,this.s),this.H=new Rc,I(this.j,0,5,this.H),this.v=new Jc,I(this.j,0,6,this.v),this.K=new Wc,I(this.j,0,7,this.K),A(this.s,2,.5),A(this.s,3,.3),A(this.H,2,.5),A(this.v,2,.5),A(this.v,3,.3),A(this.K,2,.5),A(this.J,2,.5)}get baseOptions(){return H(this.j,se,1)}set baseOptions(t){I(this.j,0,1,t)}o(t){return"minFaceDetectionConfidence"in t&&A(this.s,2,t.minFaceDetectionConfidence??.5),"minFaceSuppressionThreshold"in t&&A(this.s,3,t.minFaceSuppressionThreshold??.3),"minFacePresenceConfidence"in t&&A(this.H,2,t.minFacePresenceConfidence??.5),"outputFaceBlendshapes"in t&&(this.outputFaceBlendshapes=!!t.outputFaceBlendshapes),"minPoseDetectionConfidence"in t&&A(this.v,2,t.minPoseDetectionConfidence??.5),"minPoseSuppressionThreshold"in t&&A(this.v,3,t.minPoseSuppressionThreshold??.3),"minPosePresenceConfidence"in t&&A(this.K,2,t.minPosePresenceConfidence??.5),"outputPoseSegmentationMasks"in t&&(this.outputPoseSegmentationMasks=!!t.outputPoseSegmentationMasks),"minHandLandmarksConfidence"in t&&A(this.J,2,t.minHandLandmarksConfidence??.5),this.l(t)}D(t,e,s){const a=typeof e!="function"?e:{};return this.C=typeof e=="function"?e:s,Ml(this),ot(this,t,a),_l(this)}F(t,e,s,a){const n=typeof s!="function"?s:{};return this.C=typeof s=="function"?s:a,Ml(this),St(this,t,n,e),_l(this)}m(){var t=new De;Z(t,"input_frames_image"),U(t,"pose_landmarks"),U(t,"pose_world_landmarks"),U(t,"face_landmarks"),U(t,"left_hand_landmarks"),U(t,"left_hand_world_landmarks"),U(t,"right_hand_landmarks"),U(t,"right_hand_world_landmarks");const e=new Ge,s=new tl;qi(s,1,ea("type.googleapis.com/mediapipe.tasks.vision.holistic_landmarker.proto.HolisticLandmarkerGraphOptions"),""),function(n,i){if(i!=null)if(Array.isArray(i))z(n,2,Hd(i));else{if(!(typeof i=="string"||i instanceof It||Ta(i)))throw Error("invalid value in Any.value field: "+i+" expected a ByteString, a base64 encoded string, a Uint8Array or a jspb array");qi(n,2,uo(i,!1),gs())}}(s,this.j.g());const a=new Ee;We(a,"mediapipe.tasks.vision.holistic_landmarker.HolisticLandmarkerGraph"),fn(a,8,tl,s),K(a,"IMAGE:input_frames_image"),F(a,"POSE_LANDMARKS:pose_landmarks"),F(a,"POSE_WORLD_LANDMARKS:pose_world_landmarks"),F(a,"FACE_LANDMARKS:face_landmarks"),F(a,"LEFT_HAND_LANDMARKS:left_hand_landmarks"),F(a,"LEFT_HAND_WORLD_LANDMARKS:left_hand_world_landmarks"),F(a,"RIGHT_HAND_LANDMARKS:right_hand_landmarks"),F(a,"RIGHT_HAND_WORLD_LANDMARKS:right_hand_world_landmarks"),a.o(e),Qe(t,a),Vn(this,t),this.g.attachProtoListener("pose_landmarks",(n,i)=>{Ha(n,this.h.poseLandmarks),S(this,i)}),this.g.attachEmptyPacketListener("pose_landmarks",n=>{S(this,n)}),this.g.attachProtoListener("pose_world_landmarks",(n,i)=>{var o=this.h.poseWorldLandmarks;n=Rs(n),o.push(ga(n)),S(this,i)}),this.g.attachEmptyPacketListener("pose_world_landmarks",n=>{S(this,n)}),this.outputPoseSegmentationMasks&&(F(a,"POSE_SEGMENTATION_MASK:pose_segmentation_mask"),Ws(this,"pose_segmentation_mask"),this.g.U("pose_segmentation_mask",(n,i)=>{this.h.poseSegmentationMasks=[Ks(this,n,!0,!this.C)],S(this,i)}),this.g.attachEmptyPacketListener("pose_segmentation_mask",n=>{this.h.poseSegmentationMasks=[],S(this,n)})),this.g.attachProtoListener("face_landmarks",(n,i)=>{Ha(n,this.h.faceLandmarks),S(this,i)}),this.g.attachEmptyPacketListener("face_landmarks",n=>{S(this,n)}),this.outputFaceBlendshapes&&(U(t,"extra_blendshapes"),F(a,"FACE_BLENDSHAPES:extra_blendshapes"),this.g.attachProtoListener("extra_blendshapes",(n,i)=>{var o=this.h.faceBlendshapes;this.outputFaceBlendshapes&&(n=Nn(n),o.push(Xo(n.g()??[]))),S(this,i)}),this.g.attachEmptyPacketListener("extra_blendshapes",n=>{S(this,n)})),this.g.attachProtoListener("left_hand_landmarks",(n,i)=>{Ha(n,this.h.leftHandLandmarks),S(this,i)}),this.g.attachEmptyPacketListener("left_hand_landmarks",n=>{S(this,n)}),this.g.attachProtoListener("left_hand_world_landmarks",(n,i)=>{var o=this.h.leftHandWorldLandmarks;n=Rs(n),o.push(ga(n)),S(this,i)}),this.g.attachEmptyPacketListener("left_hand_world_landmarks",n=>{S(this,n)}),this.g.attachProtoListener("right_hand_landmarks",(n,i)=>{Ha(n,this.h.rightHandLandmarks),S(this,i)}),this.g.attachEmptyPacketListener("right_hand_landmarks",n=>{S(this,n)}),this.g.attachProtoListener("right_hand_world_landmarks",(n,i)=>{var o=this.h.rightHandWorldLandmarks;n=Rs(n),o.push(ga(n)),S(this,i)}),this.g.attachEmptyPacketListener("right_hand_world_landmarks",n=>{S(this,n)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};ee.prototype.detectForVideo=ee.prototype.F,ee.prototype.detect=ee.prototype.D,ee.prototype.setOptions=ee.prototype.o,ee.createFromModelPath=function(t,e){return R(ee,t,{baseOptions:{modelAssetPath:e}})},ee.createFromModelBuffer=function(t,e){return R(ee,t,{baseOptions:{modelAssetBuffer:e}})},ee.createFromOptions=function(t,e){return R(ee,t,e)},ee.HAND_CONNECTIONS=cr,ee.POSE_CONNECTIONS=bu,ee.FACE_LANDMARKS_LIPS=nr,ee.FACE_LANDMARKS_LEFT_EYE=ir,ee.FACE_LANDMARKS_LEFT_EYEBROW=or,ee.FACE_LANDMARKS_LEFT_IRIS=uu,ee.FACE_LANDMARKS_RIGHT_EYE=rr,ee.FACE_LANDMARKS_RIGHT_EYEBROW=lr,ee.FACE_LANDMARKS_RIGHT_IRIS=pu,ee.FACE_LANDMARKS_FACE_OVAL=dr,ee.FACE_LANDMARKS_CONTOURS=hu,ee.FACE_LANDMARKS_TESSELATION=fu;var Ke=class extends Pe{constructor(t,e){super(new it(t,e),"input_image","norm_rect",!0),this.j={classifications:[]},I(t=this.h=new zc,0,1,e=new se)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return I(this.h,0,2,Hi(t,H(this.h,Vo,2))),this.l(t)}sa(t,e){return this.j={classifications:[]},ot(this,t,e),this.j}ta(t,e,s){return this.j={classifications:[]},St(this,t,s,e),this.j}m(){var t=new De;Z(t,"input_image"),Z(t,"norm_rect"),U(t,"classifications");const e=new Ge;dt(e,U0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.image_classifier.ImageClassifierGraph"),K(s,"IMAGE:input_image"),K(s,"NORM_RECT:norm_rect"),F(s,"CLASSIFICATIONS:classifications"),s.o(e),Qe(t,s),this.g.attachProtoListener("classifications",(a,n)=>{this.j=function(i){const o={classifications:Pt(i,L0,1).map(r=>{var l;return Xo(((l=H(r,Cc,4))==null?void 0:l.g())??[],tt(r,2)??0,at(r,3)??"")})};return hn(Gs(i,2))!=null&&(o.timestampMs=hn(Gs(i,2))??0),o}(I0(a)),S(this,n)}),this.g.attachEmptyPacketListener("classifications",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ke.prototype.classifyForVideo=Ke.prototype.ta,Ke.prototype.classify=Ke.prototype.sa,Ke.prototype.setOptions=Ke.prototype.o,Ke.createFromModelPath=function(t,e){return R(Ke,t,{baseOptions:{modelAssetPath:e}})},Ke.createFromModelBuffer=function(t,e){return R(Ke,t,{baseOptions:{modelAssetBuffer:e}})},Ke.createFromOptions=function(t,e){return R(Ke,t,e)};var Ne=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!0),this.h=new Kc,this.embeddings={embeddings:[]},I(t=this.h,0,1,e=new se)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){var e=this.h,s=H(this.h,cl,2);return s=s?s.clone():new cl,t.l2Normalize!==void 0?ka(s,1,t.l2Normalize):"l2Normalize"in t&&z(s,1),t.quantize!==void 0?ka(s,2,t.quantize):"quantize"in t&&z(s,2),I(e,0,2,s),this.l(t)}za(t,e){return ot(this,t,e),this.embeddings}Aa(t,e,s){return St(this,t,s,e),this.embeddings}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"embeddings_out");const e=new Ge;dt(e,V0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.image_embedder.ImageEmbedderGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"EMBEDDINGS:embeddings_out"),s.o(e),Qe(t,s),this.g.attachProtoListener("embeddings_out",(a,n)=>{a=j0(a),this.embeddings=function(i){return{embeddings:Pt(i,_0,1).map(o=>{var l,d;const r={headIndex:tt(o,3)??0??-1,headName:at(o,4)??""??""};if(Wd(o,dl,ri(o,1))!==void 0)o=us(o=H(o,dl,ri(o,1)),1,Zt,cs()),r.floatEmbedding=o.slice();else{const c=new Uint8Array(0);r.quantizedEmbedding=((d=(l=H(o,M0,ri(o,2)))==null?void 0:l.oa())==null?void 0:d.h())??c}return r}),timestampMs:hn(Gs(i,2))??0}}(a),S(this,n)}),this.g.attachEmptyPacketListener("embeddings_out",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ne.cosineSimilarity=function(t,e){if(t.floatEmbedding&&e.floatEmbedding)t=bl(t.floatEmbedding,e.floatEmbedding);else{if(!t.quantizedEmbedding||!e.quantizedEmbedding)throw Error("Cannot compute cosine similarity between quantized and float embeddings.");t=bl(fl(t.quantizedEmbedding),fl(e.quantizedEmbedding))}return t},Ne.prototype.embedForVideo=Ne.prototype.Aa,Ne.prototype.embed=Ne.prototype.za,Ne.prototype.setOptions=Ne.prototype.o,Ne.createFromModelPath=function(t,e){return R(Ne,t,{baseOptions:{modelAssetPath:e}})},Ne.createFromModelBuffer=function(t,e){return R(Ne,t,{baseOptions:{modelAssetBuffer:e}})},Ne.createFromOptions=function(t,e){return R(Ne,t,e)};var Gi=class{constructor(t,e,s){this.confidenceMasks=t,this.categoryMask=e,this.qualityScores=s}close(){var t,e;(t=this.confidenceMasks)==null||t.forEach(s=>{s.close()}),(e=this.categoryMask)==null||e.close()}};function jl(t){t.categoryMask=void 0,t.confidenceMasks=void 0,t.qualityScores=void 0}function Pl(t){try{const e=new Gi(t.confidenceMasks,t.categoryMask,t.qualityScores);if(!t.j)return e;t.j(e)}finally{Gn(t)}}Gi.prototype.close=Gi.prototype.close;var Le=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!1),this.s=[],this.outputCategoryMask=!1,this.outputConfidenceMasks=!0,this.h=new Yo,this.v=new Yc,I(this.h,0,3,this.v),I(t=this.h,0,1,e=new se)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return t.displayNamesLocale!==void 0?z(this.h,2,ea(t.displayNamesLocale)):"displayNamesLocale"in t&&z(this.h,2),"outputCategoryMask"in t&&(this.outputCategoryMask=t.outputCategoryMask??!1),"outputConfidenceMasks"in t&&(this.outputConfidenceMasks=t.outputConfidenceMasks??!0),super.l(t)}I(){(function(t){var s,a;const e=Pt(t.da(),Ee,1).filter(n=>(at(n,1)??"").includes("mediapipe.tasks.TensorsToSegmentationCalculator"));if(t.s=[],e.length>1)throw Error("The graph has more than one mediapipe.tasks.TensorsToSegmentationCalculator.");e.length===1&&(((a=(s=H(e[0],Ge,7))==null?void 0:s.l())==null?void 0:a.g())??new Map).forEach((n,i)=>{t.s[Number(i)]=at(n,1)??""})})(this)}segment(t,e,s){const a=typeof e!="function"?e:{};return this.j=typeof e=="function"?e:s,jl(this),ot(this,t,a),Pl(this)}Ma(t,e,s,a){const n=typeof s!="function"?s:{};return this.j=typeof s=="function"?s:a,jl(this),St(this,t,n,e),Pl(this)}Da(){return this.s}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect");const e=new Ge;dt(e,Zc,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.image_segmenter.ImageSegmenterGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),s.o(e),Qe(t,s),Vn(this,t),this.outputConfidenceMasks&&(U(t,"confidence_masks"),F(s,"CONFIDENCE_MASKS:confidence_masks"),Ws(this,"confidence_masks"),this.g.ca("confidence_masks",(a,n)=>{this.confidenceMasks=a.map(i=>Ks(this,i,!0,!this.j)),S(this,n)}),this.g.attachEmptyPacketListener("confidence_masks",a=>{this.confidenceMasks=[],S(this,a)})),this.outputCategoryMask&&(U(t,"category_mask"),F(s,"CATEGORY_MASK:category_mask"),Ws(this,"category_mask"),this.g.U("category_mask",(a,n)=>{this.categoryMask=Ks(this,a,!1,!this.j),S(this,n)}),this.g.attachEmptyPacketListener("category_mask",a=>{this.categoryMask=void 0,S(this,a)})),U(t,"quality_scores"),F(s,"QUALITY_SCORES:quality_scores"),this.g.attachFloatVectorListener("quality_scores",(a,n)=>{this.qualityScores=a,S(this,n)}),this.g.attachEmptyPacketListener("quality_scores",a=>{this.categoryMask=void 0,S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Le.prototype.getLabels=Le.prototype.Da,Le.prototype.segmentForVideo=Le.prototype.Ma,Le.prototype.segment=Le.prototype.segment,Le.prototype.setOptions=Le.prototype.o,Le.createFromModelPath=function(t,e){return R(Le,t,{baseOptions:{modelAssetPath:e}})},Le.createFromModelBuffer=function(t,e){return R(Le,t,{baseOptions:{modelAssetBuffer:e}})},Le.createFromOptions=function(t,e){return R(Le,t,e)};var Ji=class{constructor(t,e,s){this.confidenceMasks=t,this.categoryMask=e,this.qualityScores=s}close(){var t,e;(t=this.confidenceMasks)==null||t.forEach(s=>{s.close()}),(e=this.categoryMask)==null||e.close()}};Ji.prototype.close=Ji.prototype.close;var X0=class extends ${constructor(t){super(t)}},Es=[0,oe,-2],gn=[0,At,-3,te,At,-1],Dl=[0,gn],ql=[0,gn,oe,-1],hi=class extends ${constructor(t){super(t)}},Rl=[0,At,-1,te],Z0=class extends ${constructor(t){super(t)}},Ol=class extends ${constructor(t){super(t)}},Wi=[1,2,3,4,5,6,7,8,9,10,14,15],mu=class extends ${constructor(t){super(t)}};mu.prototype.g=Bn([0,me,[0,Wi,J,gn,J,[0,gn,Es],J,Dl,J,[0,Dl,Es],J,Rl,J,[0,At,-3,te,nt],J,[0,At,-3,te],J,[0,G,At,-2,te,oe,te,-1,2,At,Es],J,ql,J,[0,ql,Es],At,Es,G,J,[0,At,-3,te,Es,-1],J,[0,me,Rl]],G,[0,G,oe,-1,te]]);var xt=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect_in",!1),this.outputCategoryMask=!1,this.outputConfidenceMasks=!0,this.h=new Yo,this.s=new Yc,I(this.h,0,3,this.s),I(t=this.h,0,1,e=new se)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return"outputCategoryMask"in t&&(this.outputCategoryMask=t.outputCategoryMask??!1),"outputConfidenceMasks"in t&&(this.outputConfidenceMasks=t.outputConfidenceMasks??!0),super.l(t)}segment(t,e,s,a){const n=typeof s!="function"?s:{};this.j=typeof s=="function"?s:a,this.qualityScores=this.categoryMask=this.confidenceMasks=void 0,s=this.B+1,a=new mu;const i=new Ol;var o=new X0;if(wt(o,1,255),I(i,0,12,o),e.keypoint&&e.scribble)throw Error("Cannot provide both keypoint and scribble.");if(e.keypoint){var r=new hi;ka(r,3,!0),A(r,1,e.keypoint.x),A(r,2,e.keypoint.y),ma(i,5,Wi,r)}else{if(!e.scribble)throw Error("Must provide either a keypoint or a scribble.");for(r of(o=new Z0,e.scribble))ka(e=new hi,3,!0),A(e,1,r.x),A(e,2,r.y),fn(o,1,hi,e);ma(i,15,Wi,o)}fn(a,1,Ol,i),this.g.addProtoToStream(a.g(),"drishti.RenderData","roi_in",s),ot(this,t,n);e:{try{const d=new Ji(this.confidenceMasks,this.categoryMask,this.qualityScores);if(!this.j){var l=d;break e}this.j(d)}finally{Gn(this)}l=void 0}return l}m(){var t=new De;Z(t,"image_in"),Z(t,"roi_in"),Z(t,"norm_rect_in");const e=new Ge;dt(e,Zc,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.interactive_segmenter.InteractiveSegmenterGraph"),K(s,"IMAGE:image_in"),K(s,"ROI:roi_in"),K(s,"NORM_RECT:norm_rect_in"),s.o(e),Qe(t,s),Vn(this,t),this.outputConfidenceMasks&&(U(t,"confidence_masks"),F(s,"CONFIDENCE_MASKS:confidence_masks"),Ws(this,"confidence_masks"),this.g.ca("confidence_masks",(a,n)=>{this.confidenceMasks=a.map(i=>Ks(this,i,!0,!this.j)),S(this,n)}),this.g.attachEmptyPacketListener("confidence_masks",a=>{this.confidenceMasks=[],S(this,a)})),this.outputCategoryMask&&(U(t,"category_mask"),F(s,"CATEGORY_MASK:category_mask"),Ws(this,"category_mask"),this.g.U("category_mask",(a,n)=>{this.categoryMask=Ks(this,a,!1,!this.j),S(this,n)}),this.g.attachEmptyPacketListener("category_mask",a=>{this.categoryMask=void 0,S(this,a)})),U(t,"quality_scores"),F(s,"QUALITY_SCORES:quality_scores"),this.g.attachFloatVectorListener("quality_scores",(a,n)=>{this.qualityScores=a,S(this,n)}),this.g.attachEmptyPacketListener("quality_scores",a=>{this.categoryMask=void 0,S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};xt.prototype.segment=xt.prototype.segment,xt.prototype.setOptions=xt.prototype.o,xt.createFromModelPath=function(t,e){return R(xt,t,{baseOptions:{modelAssetPath:e}})},xt.createFromModelBuffer=function(t,e){return R(xt,t,{baseOptions:{modelAssetBuffer:e}})},xt.createFromOptions=function(t,e){return R(xt,t,e)};var Ye=class extends Pe{constructor(t,e){super(new it(t,e),"input_frame_gpu","norm_rect",!1),this.j={detections:[]},I(t=this.h=new eu,0,1,e=new se)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return t.displayNamesLocale!==void 0?z(this.h,2,ea(t.displayNamesLocale)):"displayNamesLocale"in t&&z(this.h,2),t.maxResults!==void 0?wt(this.h,3,t.maxResults):"maxResults"in t&&z(this.h,3),t.scoreThreshold!==void 0?A(this.h,4,t.scoreThreshold):"scoreThreshold"in t&&z(this.h,4),t.categoryAllowlist!==void 0?bn(this.h,5,t.categoryAllowlist):"categoryAllowlist"in t&&z(this.h,5),t.categoryDenylist!==void 0?bn(this.h,6,t.categoryDenylist):"categoryDenylist"in t&&z(this.h,6),this.l(t)}D(t,e){return this.j={detections:[]},ot(this,t,e),this.j}F(t,e,s){return this.j={detections:[]},St(this,t,s,e),this.j}m(){var t=new De;Z(t,"input_frame_gpu"),Z(t,"norm_rect"),U(t,"detections");const e=new Ge;dt(e,J0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.ObjectDetectorGraph"),K(s,"IMAGE:input_frame_gpu"),K(s,"NORM_RECT:norm_rect"),F(s,"DETECTIONS:detections"),s.o(e),Qe(t,s),this.g.attachProtoVectorListener("detections",(a,n)=>{for(const i of a)a=Ic(i),this.j.detections.push(su(a));S(this,n)}),this.g.attachEmptyPacketListener("detections",a=>{S(this,a)}),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};Ye.prototype.detectForVideo=Ye.prototype.F,Ye.prototype.detect=Ye.prototype.D,Ye.prototype.setOptions=Ye.prototype.o,Ye.createFromModelPath=async function(t,e){return R(Ye,t,{baseOptions:{modelAssetPath:e}})},Ye.createFromModelBuffer=function(t,e){return R(Ye,t,{baseOptions:{modelAssetBuffer:e}})},Ye.createFromOptions=function(t,e){return R(Ye,t,e)};var Qi=class{constructor(t,e,s){this.landmarks=t,this.worldLandmarks=e,this.segmentationMasks=s}close(){var t;(t=this.segmentationMasks)==null||t.forEach(e=>{e.close()})}};function Fl(t){t.landmarks=[],t.worldLandmarks=[],t.segmentationMasks=void 0}function Bl(t){try{const e=new Qi(t.landmarks,t.worldLandmarks,t.segmentationMasks);if(!t.s)return e;t.s(e)}finally{Gn(t)}}Qi.prototype.close=Qi.prototype.close;var He=class extends Pe{constructor(t,e){super(new it(t,e),"image_in","norm_rect",!1),this.landmarks=[],this.worldLandmarks=[],this.outputSegmentationMasks=!1,I(t=this.h=new tu,0,1,e=new se),this.v=new Wc,I(this.h,0,3,this.v),this.j=new Jc,I(this.h,0,2,this.j),wt(this.j,4,1),A(this.j,2,.5),A(this.v,2,.5),A(this.h,4,.5)}get baseOptions(){return H(this.h,se,1)}set baseOptions(t){I(this.h,0,1,t)}o(t){return"numPoses"in t&&wt(this.j,4,t.numPoses??1),"minPoseDetectionConfidence"in t&&A(this.j,2,t.minPoseDetectionConfidence??.5),"minTrackingConfidence"in t&&A(this.h,4,t.minTrackingConfidence??.5),"minPosePresenceConfidence"in t&&A(this.v,2,t.minPosePresenceConfidence??.5),"outputSegmentationMasks"in t&&(this.outputSegmentationMasks=t.outputSegmentationMasks??!1),this.l(t)}D(t,e,s){const a=typeof e!="function"?e:{};return this.s=typeof e=="function"?e:s,Fl(this),ot(this,t,a),Bl(this)}F(t,e,s,a){const n=typeof s!="function"?s:{};return this.s=typeof s=="function"?s:a,Fl(this),St(this,t,n,e),Bl(this)}m(){var t=new De;Z(t,"image_in"),Z(t,"norm_rect"),U(t,"normalized_landmarks"),U(t,"world_landmarks"),U(t,"segmentation_masks");const e=new Ge;dt(e,W0,this.h);const s=new Ee;We(s,"mediapipe.tasks.vision.pose_landmarker.PoseLandmarkerGraph"),K(s,"IMAGE:image_in"),K(s,"NORM_RECT:norm_rect"),F(s,"NORM_LANDMARKS:normalized_landmarks"),F(s,"WORLD_LANDMARKS:world_landmarks"),s.o(e),Qe(t,s),Vn(this,t),this.g.attachProtoVectorListener("normalized_landmarks",(a,n)=>{this.landmarks=[];for(const i of a)a=Ma(i),this.landmarks.push(Un(a));S(this,n)}),this.g.attachEmptyPacketListener("normalized_landmarks",a=>{this.landmarks=[],S(this,a)}),this.g.attachProtoVectorListener("world_landmarks",(a,n)=>{this.worldLandmarks=[];for(const i of a)a=Rs(i),this.worldLandmarks.push(ga(a));S(this,n)}),this.g.attachEmptyPacketListener("world_landmarks",a=>{this.worldLandmarks=[],S(this,a)}),this.outputSegmentationMasks&&(F(s,"SEGMENTATION_MASK:segmentation_masks"),Ws(this,"segmentation_masks"),this.g.ca("segmentation_masks",(a,n)=>{this.segmentationMasks=a.map(i=>Ks(this,i,!0,!this.s)),S(this,n)}),this.g.attachEmptyPacketListener("segmentation_masks",a=>{this.segmentationMasks=[],S(this,a)})),t=t.g(),this.setGraph(new Uint8Array(t),!0)}};He.prototype.detectForVideo=He.prototype.F,He.prototype.detect=He.prototype.D,He.prototype.setOptions=He.prototype.o,He.createFromModelPath=function(t,e){return R(He,t,{baseOptions:{modelAssetPath:e}})},He.createFromModelBuffer=function(t,e){return R(He,t,{baseOptions:{modelAssetBuffer:e}})},He.createFromOptions=function(t,e){return R(He,t,e)},He.POSE_CONNECTIONS=bu;const eh="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm",th="https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";let ps=null,la=null,fi=0;function Nl(t,e=.16){const s=t.w*e,a=t.h*e,n=Math.max(0,t.x-s/2),i=Math.max(0,t.y-a/2);return{x:n,y:i,w:Math.min(1-n,t.w+s),h:Math.min(1-i,t.h+a)}}function Hl(t){const e=t.w*1.3,s=t.h*1.95,a=Math.max(0,t.x-(e-t.w)/2),n=Math.max(0,t.y-t.h*.28);return{x:a,y:n,w:Math.min(1-a,e),h:Math.min(1-n,s)}}function sh(t,e){const s=e.videoWidth||1,a=e.videoHeight||1,n=t.boundingBox;if(n&&n.width>=8&&n.height>=8)return Hl(Nl({x:n.originX/s,y:n.originY/a,w:n.width/s,h:n.height/a},.06));const i=t.keypoints||[];if(i.length<4)return null;const o=i.some(g=>g.x>1.5||g.y>1.5),r=i.map(g=>o?g.x/s:g.x),l=i.map(g=>o?g.y/a:g.y),d=Math.min(...r),c=Math.max(...r),u=Math.min(...l),h=Math.max(...l),p=c-d,f=h-u;return p<.04||f<.05?null:Hl(Nl({x:d,y:u,w:p,h:f},.2))}function ah(){return!!ps}async function nh(){return ps?!0:la?!!await la:(la=(async()=>{try{const t=await rs.forVisionTasks(eh),e={baseOptions:{modelAssetPath:th,delegate:"GPU"},runningMode:"VIDEO",minDetectionConfidence:.42,minSuppressionThreshold:.25};try{ps=await Ie.createFromOptions(t,e)}catch{ps=await Ie.createFromOptions(t,{...e,baseOptions:{...e.baseOptions,delegate:"CPU"}})}return ps}catch(t){return console.error("Face tracker failed to load",t),la=null,null}})(),!!await la)}function ih(t,e){if(!ps||!t.videoWidth)return[];const s=e<=fi?fi+1:e;fi=s;try{return(ps.detectForVideo(t,s).detections||[]).map(n=>sh(n,t)).filter(n=>!!n).sort((n,i)=>i.w*i.h-n.w*n.h)}catch{return[]}}function oh(t,e,s=.5){return t?{x:t.x+(e.x-t.x)*s,y:t.y+(e.y-t.y)*s,w:t.w+(e.w-t.w)*s,h:t.h+(e.h-t.h)*s}:e}const Ul=168,rh=128,lh=420;function bi(t,e,s){return Math.min(s,Math.max(e,t))}class dh{constructor(){b(this,"root",null);b(this,"stream",null);b(this,"ownStream",!1);b(this,"raf",0);b(this,"lastTick",0);b(this,"missingMs",0);b(this,"extraMs",0);b(this,"lastStatus","loading");b(this,"box",null);b(this,"pos",{x:0,y:72});b(this,"width",Ul);b(this,"dragging",!1);b(this,"resizing",!1);b(this,"dragOffset",{x:0,y:0});b(this,"resizeStart",{x:0,width:Ul});b(this,"blurBound",!1);b(this,"shotAt",0);b(this,"video",null);b(this,"audioCtx",null);b(this,"analyser",null);b(this,"audioData",null);b(this,"loudMs",0)}mount(){this.root||(this.pos.x=Math.max(16,window.innerWidth-this.width-16),this.pos.y=72,this.root=document.createElement("div"),this.root.id="exam-camera-overlay",document.body.appendChild(this.root),this.paintShell(),this.bindDrag(),this.bindResize(),this.bindBlur(),nh(),this.initVideo().catch(e=>console.error("Exam camera failed",e)))}teardown(){var e,s;this.raf&&cancelAnimationFrame(this.raf),this.raf=0,this.ownStream&&((e=this.stream)==null||e.getTracks().forEach(a=>a.stop())),this.stream=null,this.ownStream=!1,this.video=null,this.audioCtx&&this.audioCtx.state!=="closed"&&(this.audioCtx.close().catch(()=>{}),this.audioCtx=null),this.analyser=null,this.audioData=null,this.loudMs=0,(s=this.root)==null||s.remove(),this.root=null,this.missingMs=0,this.extraMs=0,this.box=null}paintShell(){if(!this.root)return;const e=y.getState(),s=e.settings.maxViolationsBeforeTerminate;this.root.innerHTML=`
      <div id="exam-cam-card" class="fixed z-[60] select-none" style="left:${this.pos.x}px;top:${this.pos.y}px;width:${this.width}px">
        <div class="relative rounded-xl border border-slate-700/80 bg-slate-950/95 shadow-2xl overflow-hidden">
          <div id="exam-cam-handle" role="button" aria-label="Drag camera" class="cursor-grab active:cursor-grabbing px-1.5 py-1 flex items-center justify-between gap-1 bg-slate-900/95 border-b border-slate-800">
            <div class="flex items-center gap-1 min-w-0">
              <span class="text-slate-500 text-[10px] tracking-widest">⠿</span>
              <span class="inline-flex items-center gap-1 px-1 py-0.5 rounded bg-red-500/15 border border-red-500/40">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span class="text-[9px] font-black tracking-wider text-red-400">REC</span>
              </span>
            </div>
            <span id="exam-cam-warns" class="text-[9px] font-bold text-slate-300 whitespace-nowrap">${e.violationCount}/${s}</span>
          </div>
          <div class="relative aspect-video bg-slate-900 overflow-hidden">
            <video id="proctor-pip-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform:scaleX(-1)"></video>
            <div id="exam-face-box" class="absolute rounded-md border-[3px] pointer-events-none" style="display:none"></div>
            <div id="exam-cam-fallback" class="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 text-lg">📷</div>
            <div id="exam-shot-flash" class="absolute inset-0 bg-white/70 opacity-0 pointer-events-none transition-opacity duration-150"></div>
            <div id="exam-cam-badge" class="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-700 text-white">Finding face</div>
          </div>
          <button type="button" id="exam-cam-resize" aria-label="Resize camera" title="Drag corner to resize" class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize text-slate-200 hover:text-white bg-slate-800/90 hover:bg-blue-600 rounded-tl-md flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M11 5V11H5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M11 8.5L8.5 11M11 6L6 11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div id="exam-cam-toast" class="hidden mt-2 max-w-full rounded-xl border border-red-500/40 bg-red-950/95 px-3 py-2 shadow-xl">
          <p class="text-[10px] font-bold uppercase tracking-wider text-red-300">Warning</p>
          <p id="exam-cam-toast-copy" class="text-xs font-medium text-white"></p>
        </div>
      </div>
    `}card(){var e;return(e=this.root)==null?void 0:e.querySelector("#exam-cam-card")}bindDrag(){var i;const e=(i=this.root)==null?void 0:i.querySelector("#exam-cam-handle");if(!e)return;const s=o=>{if(!this.dragging)return;this.pos.x=bi(o.clientX-this.dragOffset.x,8,window.innerWidth-80),this.pos.y=bi(o.clientY-this.dragOffset.y,8,window.innerHeight-80);const r=this.card();r&&(r.style.left=`${this.pos.x}px`,r.style.top=`${this.pos.y}px`)},a=()=>{this.dragging&&(this.dragging=!1,e.classList.replace("cursor-grabbing","cursor-grab"),window.removeEventListener("pointermove",s),window.removeEventListener("mousemove",s),window.removeEventListener("pointerup",a),window.removeEventListener("mouseup",a))},n=o=>{o.button===0&&(this.dragging=!0,this.dragOffset.x=o.clientX-this.pos.x,this.dragOffset.y=o.clientY-this.pos.y,e.classList.replace("cursor-grab","cursor-grabbing"),window.addEventListener("pointermove",s),window.addEventListener("mousemove",s),window.addEventListener("pointerup",a),window.addEventListener("mouseup",a))};e.addEventListener("pointerdown",n),e.addEventListener("mousedown",n)}bindResize(){var i;const e=(i=this.root)==null?void 0:i.querySelector("#exam-cam-resize");if(!e)return;const s=o=>{this.resizing&&this.setWidth(this.resizeStart.width+(o.clientX-this.resizeStart.x))},a=()=>{this.resizing=!1,window.removeEventListener("pointermove",s),window.removeEventListener("mousemove",s),window.removeEventListener("pointerup",a),window.removeEventListener("mouseup",a)},n=o=>{o.preventDefault(),o.stopPropagation(),this.resizing=!0,this.resizeStart={x:o.clientX,width:this.width},window.addEventListener("pointermove",s),window.addEventListener("mousemove",s),window.addEventListener("pointerup",a),window.addEventListener("mouseup",a)};e.addEventListener("pointerdown",n),e.addEventListener("mousedown",n)}setWidth(e){const s=bi(e,rh,lh),a=this.pos.x+s-(window.innerWidth-8);a>0&&(this.pos.x=Math.max(8,this.pos.x-a)),this.width=s;const n=this.card();n&&(n.style.width=`${this.width}px`,n.style.left=`${this.pos.x}px`)}bindBlur(){this.blurBound||(this.blurBound=!0,window.addEventListener("blur",()=>{const e=y.getState();e.examStarted&&!e.examCompleted&&this.warn("Tab Switch","Window focus lost (tab switch or another window).","high")}))}async initVideo(){var n,i;const e=(n=this.root)==null?void 0:n.querySelector("#proctor-pip-video"),s=(i=this.root)==null?void 0:i.querySelector("#exam-cam-fallback"),a=y.getLiveCameraStream();try{if(this.stream=a||await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0}),this.ownStream=!a,this.stream&&y.registerMediaStream(this.stream),this.stream&&this.stream.getAudioTracks().length>0)try{const o=window.AudioContext||window.webkitAudioContext;if(o){this.audioCtx=new o;const r=this.audioCtx.createMediaStreamSource(this.stream);this.analyser=this.audioCtx.createAnalyser(),this.analyser.fftSize=512,this.analyser.smoothingTimeConstant=.4,r.connect(this.analyser),this.audioData=new Uint8Array(this.analyser.frequencyBinCount)}}catch{}e&&this.stream&&(this.video=e,e.srcObject=this.stream,s&&(s.style.display="none"),await e.play().catch(()=>{}),this.startMonitor())}catch{s&&(s.textContent="Camera blocked")}}startMonitor(){this.raf&&cancelAnimationFrame(this.raf),this.lastTick=performance.now();const e=s=>{this.raf=requestAnimationFrame(e),this.tick(s)};this.raf=requestAnimationFrame(e)}tick(e){const s=this.video;if(!s||!s.videoWidth||!this.root)return;const a=Math.min(80,e-this.lastTick);this.lastTick=e;const n=y.getState();if(!ah()){this.paintFrame("loading",this.box,!1),this.paintChrome(n.violationCount,n.settings.maxViolationsBeforeTerminate);return}const i=ih(s,e),o=i[0]||null,r=!!o;let l=r?"in-frame":"out-of-frame";if(n.settings.detectMultipleFaces&&i.length>=2&&(l="multiple"),o&&(this.box=oh(this.box,o,.55)),this.paintFrame(l,this.box||o,!r),this.paintChrome(n.violationCount,n.settings.maxViolationsBeforeTerminate),!!(n.examStarted&&!n.examCompleted)){if(n.settings.requireMicrophone&&this.analyser&&this.audioData){this.analyser.getByteFrequencyData(this.audioData);let c=0;for(let h=0;h<this.audioData.length;h++)c+=this.audioData[h];c/this.audioData.length>48?(this.loudMs+=a,this.loudMs>=1600&&(this.warn("Background Voice","Excessive speaking or background audio detected.","medium"),this.loudMs=0)):this.loudMs=Math.max(0,this.loudMs-a*2)}r?l==="multiple"?(this.extraMs+=a,this.missingMs=0,this.extraMs>=800&&(this.captureShot(s,"Another person was detected in the camera."),this.warn("Multiple Faces","Another face was recognized. Only the candidate may be in view.","high"),this.extraMs=0)):(this.missingMs=0,this.extraMs=0,this.lastStatus!=="in-frame"&&this.hideToast()):(this.missingMs+=a,this.extraMs=0,this.missingMs>=900&&(this.warn("No Face Detected","No face recognized. Look at the camera and stay in frame.","high"),this.missingMs=0)),this.lastStatus=l}}paintFrame(e,s,a){var ht,Rt,Ot,ts;const n=(ht=this.root)==null?void 0:ht.querySelector("#exam-face-box"),i=(Rt=this.root)==null?void 0:Rt.querySelector("#exam-cam-badge");if(!n||!i)return;const o={loading:"Finding face","in-frame":"Face locked","out-of-frame":"No face",multiple:"Other face"},r={loading:"bg-slate-700 text-white","in-frame":"bg-emerald-500 text-white","out-of-frame":"bg-red-600 text-white",multiple:"bg-amber-500 text-slate-950"};i.className=`absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${r[e]}`,i.textContent=o[e];const l=a||!s?{x:.06,y:.06,w:.88,h:.88}:s,d=n.parentElement,c=((Ot=this.video)==null?void 0:Ot.videoWidth)||640,u=((ts=this.video)==null?void 0:ts.videoHeight)||480,h=(d==null?void 0:d.clientWidth)||this.width,p=(d==null?void 0:d.clientHeight)||Math.round(this.width*9/16),f=c/u,g=h/Math.max(p,1);let m=h/c,w=0,v=0;g>f?(m=h/c,v=(p-u*m)/2):(m=p/u,w=(h-c*m)/2);const j=1-l.x-l.w;n.style.display="block",n.style.left=`${w+j*c*m}px`,n.style.top=`${v+l.y*u*m}px`,n.style.width=`${l.w*c*m}px`,n.style.height=`${l.h*u*m}px`;const he=a||e==="out-of-frame";n.style.borderColor=he?"#ef4444":e==="multiple"?"#f59e0b":"#22c55e",n.style.boxShadow=he?"0 0 0 999px rgba(239,68,68,0.16) inset":"0 0 0 1px rgba(34,197,94,0.35)"}paintChrome(e,s){var n;const a=(n=this.root)==null?void 0:n.querySelector("#exam-cam-warns");a&&(a.textContent=`${e}/${s}`)}showToast(e){var n,i;const s=(n=this.root)==null?void 0:n.querySelector("#exam-cam-toast"),a=(i=this.root)==null?void 0:i.querySelector("#exam-cam-toast-copy");!s||!a||(a.textContent=e,s.classList.remove("hidden"))}hideToast(){var e,s;(s=(e=this.root)==null?void 0:e.querySelector("#exam-cam-toast"))==null||s.classList.add("hidden")}warn(e,s,a){this.showToast(s),y.logProctoringViolation(e,s,a)}captureShot(e,s){var c;const a=Date.now();if(a-this.shotAt<8e3||!e.videoWidth)return;this.shotAt=a;const n=document.createElement("canvas"),i=480,o=Math.round(e.videoHeight/e.videoWidth*i)||270;n.width=i,n.height=o;const r=n.getContext("2d");if(!r)return;r.drawImage(e,0,0,i,o);const l=n.toDataURL("image/jpeg",.55);ba.sendSnapshot(l,s);const d=(c=this.root)==null?void 0:c.querySelector("#exam-shot-flash");d&&(d.style.opacity="1",window.setTimeout(()=>{d.style.opacity="0"},140))}}const xu=new dh;function ch(){xu.mount()}function Ua(){xu.teardown()}const Vl={aadhaar:"Aadhaar",pan:"PAN card",voter_id:"Voter ID"};class Gl{constructor(e){b(this,"container");b(this,"cameraStream",null);b(this,"isCameraPassed",!1);b(this,"isMicPassed",!1);b(this,"isNetworkPassed",!1);b(this,"isBrowserPassed",!1);b(this,"downloadMbps",0);b(this,"previewTarget","off");b(this,"singleMonitor",null);b(this,"screenWidth",0);b(this,"screenHeight",0);b(this,"isPhotoCaptured",!1);b(this,"isIdUploaded",!1);b(this,"photoJpeg","");b(this,"idJpeg","");b(this,"idType","");b(this,"savingPhoto",!1);b(this,"savingId",!1);this.container=e}async render(){this.container.innerHTML=`
      <div class="max-w-6xl mx-auto py-10 px-4">
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>STEP 4 OF 5</span> • System Pre-Flight Diagnostics
          </div>
          <h1 class="text-3xl font-extrabold text-white tracking-tight">Candidate System Hardware & Network Verification</h1>
          <p class="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Camera, microphone, and internet speed are measured on this device. Download speed must be at least 5 Mbps.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-4">
            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h2 class="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Hardware & Permission Diagnostics</span>
                <button id="recheck-btn" class="text-xs font-semibold px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400 hover:text-blue-300">
                  🔄 Re-test Hardware
                </button>
              </h2>

              <div id="cam-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">📷</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Webcam Access</h3>
                      <p class="text-xs text-slate-400">Live video frames from this device</p>
                    </div>
                  </div>
                  <div id="cam-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="cam-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="mic-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">🎙️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Microphone</h3>
                      <p id="mic-sub-text" class="text-xs text-slate-400">Checking that the microphone is on...</p>
                    </div>
                  </div>
                  <div id="mic-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="mic-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="net-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg">⚡</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Internet Speed</h3>
                      <p id="net-sub-text" class="text-xs text-slate-400">Measuring download speed. Minimum 5 Mbps.</p>
                    </div>
                  </div>
                  <div id="net-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Testing...</span>
                  </div>
                </div>
                <p id="net-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>

              <div id="browser-card" class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">🖥️</div>
                    <div>
                      <h3 class="text-sm font-semibold text-white">Browser & Screen</h3>
                      <p id="browser-sub-text" class="text-xs text-slate-400">Checking resolution and monitors...</p>
                    </div>
                  </div>
                  <div id="browser-status-badge">
                    <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">Checking...</span>
                  </div>
                </div>
                <p id="browser-err-msg" class="text-[11px] font-semibold text-red-400 hidden pt-1 border-t border-slate-800/60"></p>
              </div>
              <p id="checks-save-status" class="text-[11px] text-slate-500 hidden"></p>
            </div>

            <div class="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Exam Integrity Terms & Declaration</h3>
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

          <div class="space-y-4">
            <div class="glass-panel p-4 rounded-2xl border border-slate-800 text-center space-y-3">
              <h3 id="camera-feed-title" class="text-xs font-bold text-slate-300 uppercase tracking-wider">Candidate photo</h3>
              <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                <video id="webcam-preview" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                <img id="face-still" alt="Captured candidate photo" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">📷</span>
                  <span class="text-xs font-medium">Initializing camera stream...</span>
                </div>
              </div>
              <p id="camera-mode-label" class="text-[11px] text-slate-400">Live camera. Capture your photo, then the camera turns off.</p>
              <button type="button" id="snap-photo-btn" class="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                <span>📸</span> Snap Candidate Photo
              </button>
              <div id="photo-preview-box" class="hidden p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2">
                <span id="photo-preview-label">Candidate photo</span>
                <img id="cand-photo-img" alt="Candidate photo" class="w-10 h-10 rounded-lg object-cover border border-emerald-500/40" />
              </div>
              <p id="photo-save-status" class="text-[11px] font-semibold text-left hidden"></p>
            </div>

            <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💳</span> Government ID Capture
              </h3>
              <p class="text-[11px] text-slate-400">Choose the ID type. The same camera starts here. After you capture the card, the camera stays on.</p>
              <label class="block text-[11px] font-semibold text-slate-300" for="govt-id-type">Government ID type</label>
              <select id="govt-id-type" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100">
                <option value="">Choose a government ID</option>
                <option value="aadhaar">Aadhaar</option>
                <option value="pan">PAN card</option>
                <option value="voter_id">Voter ID</option>
              </select>
              <div id="id-camera-box" class="hidden relative w-full aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                <video id="id-webcam" autoplay playsinline muted class="w-full h-full object-cover"></video>
                <img id="id-still" alt="Captured government ID" class="hidden absolute inset-0 w-full h-full object-cover" />
                <div id="id-cam-placeholder" class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                  <span class="text-3xl mb-1">💳</span>
                  <span class="text-xs font-medium">Starting camera...</span>
                </div>
              </div>
              <p id="id-camera-hint" class="text-[11px] text-slate-500">Camera is off until you choose an ID type.</p>
              <button type="button" id="snap-id-live-btn" disabled class="w-full py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 opacity-50 cursor-not-allowed">
                <span>📸</span> Capture ID
              </button>
              <div id="id-preview-box" class="hidden p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center justify-between gap-2">
                <span id="id-preview-label">Government ID</span>
                <img id="id-card-img" alt="Government ID" class="w-10 h-10 rounded-lg object-cover border border-purple-500/40" />
              </div>
              <p id="id-save-status" class="text-[11px] font-semibold hidden"></p>
              <div id="stay-on-box" class="hidden space-y-2">
                <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
                <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
                  <video id="stay-on-video" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
                </div>
              </div>
            </div>

            <button
              id="start-exam-btn"
              disabled
              class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 opacity-50 cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <span>ENTER SECURE EXAM ENVIRONMENT</span>
              <span>➔</span>
            </button>
            <p id="gate-msg" class="text-xs font-semibold text-amber-400 text-center">Complete the checks, then save your photo and government ID.</p>
          </div>
        </div>
      </div>
    `,await this.runLiveDiagnostics(),this.attachEvents()}snapshot(){return{cameraPassed:this.isCameraPassed,microphonePassed:this.isMicPassed,microphoneDb:null,networkPassed:this.isNetworkPassed,pingMs:null,downloadMbps:this.isNetworkPassed?Math.round(this.downloadMbps*10)/10:null,browserPassed:this.isBrowserPassed,screenWidth:this.screenWidth,screenHeight:this.screenHeight,singleMonitor:this.singleMonitor}}async runLiveDiagnostics(){var r,l;const e=this.container.querySelector("#webcam-preview"),s=this.container.querySelector("#cam-placeholder");if(this.previewTarget!=="exam"&&this.stopCamera(),this.isPhotoCaptured)this.isCameraPassed=!0,this.isMicPassed=!0;else try{await this.startPreview("face");const d=(r=this.cameraStream)==null?void 0:r.getVideoTracks()[0];d&&d.readyState==="live"&&e&&e.videoWidth>0?(this.isCameraPassed=!0,this.updateBadge("#cam-status-badge",!0,"Live ✓"),this.hideError("#cam-err-msg")):(this.isCameraPassed=!1,this.updateBadge("#cam-status-badge",!1,"No frames ✖"),this.showError("#cam-err-msg","The webcam opened but no video frames arrived. Check that it is not in use by another app, then re-test."));const c=(l=this.cameraStream)==null?void 0:l.getAudioTracks()[0];if(c&&c.readyState==="live"&&c.enabled){this.isMicPassed=!0,this.updateBadge("#mic-status-badge",!0,"Live ✓");const u=this.container.querySelector("#mic-sub-text");u&&(u.textContent="Microphone is on."),this.hideError("#mic-err-msg")}else this.isMicPassed=!1,this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","No live microphone. Allow microphone access and re-test.")}catch{this.isCameraPassed=!1,this.isMicPassed=!1,this.updateBadge("#cam-status-badge",!1,"Failed ✖"),this.showError("#cam-err-msg","Camera permission denied or no camera found. Allow camera access in the address bar and re-test."),this.updateBadge("#mic-status-badge",!1,"Failed ✖"),this.showError("#mic-err-msg","Microphone permission denied or no microphone found. Allow microphone access and re-test."),s&&(s.innerHTML=`
          <span class="text-2xl text-red-400 mb-1">⚠️</span>
          <span class="text-xs font-semibold text-red-300 text-center px-4">Camera permission denied</span>
        `)}try{if(navigator.onLine===!1)throw new Error("This device reports that it is offline.");this.downloadMbps=await this.measureDownloadMbps();const d=(Math.round(this.downloadMbps*10)/10).toFixed(1),c=this.container.querySelector("#net-sub-text");this.downloadMbps>=5?(this.isNetworkPassed=!0,this.updateBadge("#net-status-badge",!0,`${d} Mbps ✓`),c&&(c.textContent=`Download speed ${d} Mbps. Minimum is 5 Mbps.`),this.hideError("#net-err-msg")):(this.isNetworkPassed=!1,this.updateBadge("#net-status-badge",!1,`${d} Mbps ✖`),c&&(c.textContent=`Download speed ${d} Mbps.`),this.showError("#net-err-msg","Internet speed must be at least 5 Mbps. Move to a faster connection and re-test."))}catch(d){this.isNetworkPassed=!1,this.downloadMbps=0,this.updateBadge("#net-status-badge",!1,"Failed ✖");const c=d instanceof Error?d.message:"The speed test did not finish.";this.showError("#net-err-msg",c);const u=this.container.querySelector("#net-sub-text");u&&(u.textContent="Could not measure download speed.")}this.screenWidth=window.screen.width,this.screenHeight=window.screen.height;const a=window.screen.isExtended;this.singleMonitor=typeof a=="boolean"?!a:null;const n=this.singleMonitor===null?"monitor count not reported":this.singleMonitor?"one monitor":"more than one monitor",i=this.container.querySelector("#browser-sub-text");i&&(i.textContent=`Screen ${this.screenWidth}×${this.screenHeight} • ${n}`);const o=typeof document.documentElement.requestFullscreen=="function";if(this.screenWidth>=1024&&o&&this.singleMonitor!==!1)this.isBrowserPassed=!0,this.updateBadge("#browser-status-badge",!0,"Compatible ✓"),this.hideError("#browser-err-msg");else{this.isBrowserPassed=!1,this.updateBadge("#browser-status-badge",!1,"Failed ✖");const d=[];this.screenWidth<1024&&d.push("the screen must be at least 1024 px wide"),o||d.push("this browser cannot enter fullscreen"),this.singleMonitor===!1&&d.push("disconnect extra monitors and use a single screen"),this.showError("#browser-err-msg",d.join("; ")+".")}this.checkButtonState(),this.recordChecks()}waitForVideo(e){return e.videoWidth>0?Promise.resolve():new Promise(s=>{const a=()=>s();e.addEventListener("loadeddata",a,{once:!0}),window.setTimeout(a,2e3)})}stopCamera(){var e;(e=this.cameraStream)==null||e.getTracks().forEach(s=>s.stop()),this.cameraStream=null,this.previewTarget="off";for(const s of["#webcam-preview","#id-webcam"]){const a=this.container.querySelector(s);a&&(a.srcObject=null)}}async startPreview(e){this.stopCamera();const s=this.container.querySelector(e==="face"?"#webcam-preview":"#id-webcam"),a=this.container.querySelector(e==="face"?"#cam-placeholder":"#id-cam-placeholder");if(!s)throw new Error("Camera preview is not on the page.");const n=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0});this.cameraStream=n,this.previewTarget=e,y.registerMediaStream(n),s.classList.remove("hidden"),s.srcObject=n,await this.waitForVideo(s),a&&s.videoWidth>0&&(a.style.display="none")}async measureDownloadMbps(){const e=L.getCandidateToken(),s=performance.now(),a=await fetch(`${L.apiBase}/api/v1/candidate/speed-sample`,{cache:"no-store",headers:e?{Authorization:`Bearer ${e}`}:{}});if(!a.ok)throw new Error(`The speed test failed (${a.status}).`);const n=await a.arrayBuffer(),i=(performance.now()-s)/1e3;if(i<=0||n.byteLength<1e5)throw new Error("The speed test did not return enough data.");return n.byteLength*8/(i*1e6)}async recordChecks(){const e=this.container.querySelector("#checks-save-status");try{const s=await this.postIdentity("checks");e&&(e.textContent=`Checks saved for ${s.name} (${s.email}).`,e.className="text-[11px] font-semibold text-emerald-400")}catch(s){e&&(e.textContent=this.errorText(s),e.className="text-[11px] font-semibold text-red-400")}}updateBadge(e,s,a){const n=this.container.querySelector(e);n&&(n.innerHTML=`
        <span class="px-2.5 py-1 text-xs font-semibold rounded-full border ${s?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}">${a}</span>
      `)}showError(e,s){const a=this.container.querySelector(e);a&&(a.textContent=s,a.classList.remove("hidden"))}hideError(e){const s=this.container.querySelector(e);s&&s.classList.add("hidden")}checkButtonState(){const e=this.container.querySelector("#declaration-check"),s=this.container.querySelector("#start-exam-btn"),a=this.container.querySelector("#gate-msg");if(!s||!a)return;const n=this.isCameraPassed&&this.isMicPassed&&this.isNetworkPassed&&this.isBrowserPassed,i=!!(e!=null&&e.checked),o=this.isPhotoCaptured&&this.isIdUploaded&&!this.savingPhoto&&!this.savingId;n&&i&&o?(s.disabled=!1,s.classList.remove("opacity-50","cursor-not-allowed"),a.textContent="Checks passed. Photo and government ID are saved as JPEG.",a.className="text-xs font-semibold text-emerald-400 text-center"):(s.disabled=!0,s.classList.add("opacity-50","cursor-not-allowed"),n?o?(a.textContent="Accept the exam terms to continue.",a.className="text-xs font-semibold text-amber-400 text-center"):(a.textContent="Snap your photo and a government ID. Each one is saved as a JPEG when you click it.",a.className="text-xs font-semibold text-amber-400 text-center"):(a.textContent="Fix the failed camera, microphone, network, or screen check, then re-test.",a.className="text-xs font-semibold text-red-400 text-center"))}errorText(e){return e instanceof V||e instanceof Error?e.message:"Could not save. Please try again."}setStatus(e,s,a){const n=this.container.querySelector(e);n&&(n.textContent=s,n.className=`text-[11px] font-semibold ${a?"text-emerald-400":"text-red-400"}`,n.classList.remove("hidden"))}frameToJpeg(e,s,a){const i=s>960?960/s:1,o=document.createElement("canvas");o.width=Math.max(1,Math.round(s*i)),o.height=Math.max(1,Math.round(a*i));const r=o.getContext("2d");if(!r)throw new Error("This browser could not create the JPEG.");r.drawImage(e,0,0,o.width,o.height);const l=o.toDataURL("image/jpeg",.82);if(!l.startsWith("data:image/jpeg"))throw new Error("This browser could not encode a JPEG.");return l}captureVideoJpeg(e){if(!e.videoWidth)throw new Error("The camera has no picture yet. Allow the webcam and re-test.");return this.frameToJpeg(e,e.videoWidth,e.videoHeight)}async postIdentity(e,s){const a={kind:e,systemCheck:this.snapshot()};return s&&(a.image=s),e==="id"&&(a.idDocumentType=this.idType),L.fetchJson("/candidate/identity","POST",a,"candidate")}remember(e){y.registerCandidateIdentity(e.candidateId,e.livePhotoStored?this.photoJpeg:"",e.idProofStored?this.idJpeg:"",{name:e.name,email:e.email})}selectedIdType(){const e=this.container.querySelector("#govt-id-type"),s=(e==null?void 0:e.value)||"";return s in Vl?s:""}freezeFace(e){this.stopCamera();const s=this.container.querySelector("#webcam-preview"),a=this.container.querySelector("#face-still"),n=this.container.querySelector("#camera-mode-label"),i=this.container.querySelector("#snap-photo-btn");s&&s.classList.add("hidden"),a&&(a.src=e,a.classList.remove("hidden")),n&&(n.textContent="Camera off. Your photo is saved."),i&&(i.disabled=!0,i.classList.add("opacity-50","cursor-not-allowed"))}keepCameraOn(e){const s=this.container.querySelector("#id-webcam"),a=this.container.querySelector("#id-still"),n=this.container.querySelector("#id-camera-box"),i=this.container.querySelector("#id-camera-hint"),o=this.container.querySelector("#snap-id-live-btn"),r=this.container.querySelector("#stay-on-box"),l=this.container.querySelector("#stay-on-video");n==null||n.classList.remove("hidden"),s&&(s.classList.add("hidden"),s.srcObject=null),a&&(a.src=e,a.classList.remove("hidden")),r==null||r.classList.remove("hidden"),l&&this.cameraStream&&(l.srcObject=this.cameraStream),this.previewTarget="exam",i&&(i.textContent="ID saved. The camera is on and stays on."),o&&(o.disabled=!0,o.classList.add("opacity-50","cursor-not-allowed"))}async startIdCamera(){if(!this.isPhotoCaptured){this.setStatus("#id-save-status","Capture your photo first. The camera starts here after that.",!1);const n=this.container.querySelector("#govt-id-type");n&&(n.value=""),this.idType="";return}const e=this.container.querySelector("#id-camera-box"),s=this.container.querySelector("#id-camera-hint"),a=this.container.querySelector("#snap-id-live-btn");e==null||e.classList.remove("hidden"),s&&(s.textContent="Starting the camera..."),await this.startPreview("id"),s&&(s.textContent="Camera is on. Hold the ID up to this camera, then capture it."),a&&(a.disabled=!1,a.classList.remove("opacity-50","cursor-not-allowed"))}async savePhoto(e){const s=this.container.querySelector("#cand-photo-img"),a=this.container.querySelector("#photo-preview-box"),n=this.container.querySelector("#photo-preview-label");this.photoJpeg=e,s&&(s.src=e),a&&a.classList.remove("hidden"),n&&(n.textContent="Saving JPEG..."),this.savingPhoto=!0,this.isPhotoCaptured=!1,this.checkButtonState();try{const i=await this.postIdentity("photo",e);this.remember(i),this.isPhotoCaptured=i.livePhotoStored,this.isPhotoCaptured&&this.freezeFace(e),n&&(n.textContent="Saved as JPEG"),this.setStatus("#photo-save-status",`Photo saved for ${i.name} (${i.email}). Camera off.`,!0)}catch(i){this.isPhotoCaptured=!1,n&&(n.textContent="Not saved"),this.setStatus("#photo-save-status",this.errorText(i),!1)}finally{this.savingPhoto=!1,this.checkButtonState()}}async saveId(e){if(this.idType=this.selectedIdType(),!this.idType){this.setStatus("#id-save-status","Choose Aadhaar, PAN card, or Voter ID first.",!1);return}const s=this.container.querySelector("#id-card-img"),a=this.container.querySelector("#id-preview-box"),n=this.container.querySelector("#id-preview-label");this.idJpeg=e,s&&(s.src=e),a&&a.classList.remove("hidden"),n&&(n.textContent="Saving JPEG..."),this.savingId=!0,this.isIdUploaded=!1,this.checkButtonState();try{const i=await this.postIdentity("id",e);this.remember(i),this.isIdUploaded=i.idProofStored;const o=Vl[this.idType];this.isIdUploaded&&this.previewTarget==="id"&&this.keepCameraOn(e),n&&(n.textContent=`${o} saved as JPEG`),this.setStatus("#id-save-status",`${o} saved for ${i.name} (${i.email}). Camera is on.`,!0)}catch(i){this.isIdUploaded=!1,n&&(n.textContent="Not saved"),this.setStatus("#id-save-status",this.errorText(i),!1)}finally{this.savingId=!1,this.checkButtonState()}}attachEvents(){const e=this.container.querySelector("#declaration-check"),s=this.container.querySelector("#start-exam-btn"),a=this.container.querySelector("#recheck-btn"),n=this.container.querySelector("#snap-photo-btn"),i=this.container.querySelector("#webcam-preview"),o=this.container.querySelector("#snap-id-live-btn"),r=this.container.querySelector("#govt-id-type");n==null||n.addEventListener("click",()=>{(async()=>{if(!(!i||this.previewTarget!=="face"))try{const l=this.captureVideoJpeg(i);await this.savePhoto(l)}catch(l){this.setStatus("#photo-save-status",this.errorText(l),!1)}})()}),o==null||o.addEventListener("click",()=>{(async()=>{const l=this.container.querySelector("#id-webcam");if(!this.selectedIdType()){this.setStatus("#id-save-status","Choose Aadhaar, PAN card, or Voter ID first.",!1);return}if(!l||this.previewTarget!=="id"){this.setStatus("#id-save-status","Choose the ID type so the camera starts in this section.",!1);return}try{const d=this.captureVideoJpeg(l);await this.saveId(d)}catch(d){this.setStatus("#id-save-status",this.errorText(d),!1)}})()}),r==null||r.addEventListener("change",()=>{if(this.idType=this.selectedIdType(),!!this.idType){if(this.isIdUploaded&&this.idJpeg){this.saveId(this.idJpeg);return}this.startIdCamera().catch(l=>this.setStatus("#id-save-status",this.errorText(l),!1))}}),e==null||e.addEventListener("change",()=>this.checkButtonState()),a==null||a.addEventListener("click",()=>{this.runLiveDiagnostics().catch(l=>console.error("Hardware diagnostics failed",l))}),s==null||s.addEventListener("click",()=>{var c,u;if(!this.isPhotoCaptured||!this.isIdUploaded)return;const l=y.getState().activeCandidateId;if(!l)return;y.completeSystemCheck();const d=y.getState().candidates.find(h=>h.id===l);(d==null?void 0:d.identityStatus)==="approved"?(y.startExam(),(u=(c=document.documentElement).requestFullscreen)==null||u.call(c).catch(()=>{})):this.renderWaitingForApprovalScreen()})}renderWaitingForApprovalScreen(){var n;this.container.innerHTML=`
      <div class="max-w-xl mx-auto py-16 px-4 text-center">
        <div class="glass-panel p-8 rounded-3xl border border-amber-500/30 bg-slate-950/90 space-y-6 shadow-2xl">
          <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mx-auto animate-pulse">
            ⏳
          </div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mx-auto mb-1">
            <span>✓ Check-in Verification Completed</span>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-white">Identity & Hardware Verification Confirmed</h2>
            <p class="text-xs text-slate-300 mt-2">
              Your live photo, government ID, and hardware diagnostics have been verified.
            </p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold space-y-2">
            <p class="text-emerald-400 font-bold flex items-center justify-center gap-1.5">
              <span>⏱️ Check-in window active (up to 30 min prior)</span>
            </p>
            <p class="text-slate-300 font-normal">Security protocol active: please stay on this screen. Your assessment will begin promptly at the scheduled start time once admitted by the proctor.</p>
          </div>
          <div class="flex items-center justify-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Waiting for proctor authorization...</span>
          </div>
          <div class="text-left space-y-2">
            <p class="text-[11px] font-semibold text-emerald-400">Camera is on and stays on.</p>
            <div class="relative w-full aspect-video rounded-xl bg-slate-900 border border-emerald-500/30 overflow-hidden">
              <video id="wait-cam" autoplay playsinline muted class="w-full h-full object-cover" style="transform: scaleX(-1)"></video>
            </div>
          </div>
        </div>
      </div>
    `;const e=this.container.querySelector("#wait-cam"),s=(n=this.cameraStream)!=null&&n.getVideoTracks().some(i=>i.readyState==="live")?this.cameraStream:null;e&&s?e.srcObject=s:e&&navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:!0}).then(i=>{this.cameraStream=i,y.registerMediaStream(i),e.srcObject=i}).catch(()=>{});const a=y.subscribe(()=>{var r,l;const i=y.getState().activeCandidateId,o=y.getState().candidates.find(d=>d.id===i);(o==null?void 0:o.identityStatus)==="approved"&&(a(),y.startExam(),(l=(r=document.documentElement).requestFullscreen)==null||l.call(r).catch(()=>{}))})}}function Jl(t){const e=Math.max(0,Math.floor(t)),s=Math.floor(e/3600),a=Math.floor(e%3600/60),n=e%60;return`${String(s).padStart(2,"0")}:${String(a).padStart(2,"0")}:${String(n).padStart(2,"0")}`}const ve=class ve{constructor(e){b(this,"container");b(this,"selectedRating",0);b(this,"feedbackDraft","");this.container=e,this.attachFullscreenEnforcement()}attachFullscreenEnforcement(){var s;if(ve.fullscreenEnforcementBound)return;ve.fullscreenEnforcementBound=!0;const e=document.createElement("div");e.id="fullscreen-enforcer-overlay",e.className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center hidden",e.innerHTML=`
      <div class="glass-panel p-8 rounded-3xl border border-red-500/50 text-center max-w-lg space-y-6 shadow-2xl">
        <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center text-4xl animate-pulse">
          ⚠️
        </div>
        <div>
          <h2 id="fullscreen-enforcer-title" class="text-xl font-extrabold text-white">Fullscreen required</h2>
          <p id="fullscreen-enforcer-copy" class="text-sm text-slate-300 mt-2">
            The proctor has admitted you. Enter fullscreen to continue the assessment.
          </p>
        </div>
        <button id="resume-fullscreen-btn" class="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2">
          <span>🛡️ RE-ENTER FULLSCREEN TO RESUME</span>
        </button>
      </div>
    `,document.body.appendChild(e),(s=e.querySelector("#resume-fullscreen-btn"))==null||s.addEventListener("click",()=>{document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}),document.addEventListener("fullscreenchange",()=>{const a=y.getState(),n=a.candidateFeedback!==null||a.examCompleted;if(!a.examStarted||n){e.classList.add("hidden");return}const i=e.querySelector("#fullscreen-enforcer-title"),o=e.querySelector("#fullscreen-enforcer-copy");if(document.fullscreenElement)ve.wasFullscreen=!0,e.classList.add("hidden");else{if(e.classList.remove("hidden"),ve.wasFullscreen){is(),y.logProctoringViolation("Fullscreen Exit","Candidate left fullscreen lockdown","high");const r=y.getState(),l=r.violationCount,d=r.settings.maxViolationsBeforeTerminate;i&&(i.textContent=l>=d?"Exam closing":`Fullscreen warning ${l} of ${d}`),o&&(o.textContent=l>=d?"You left fullscreen too many times. The exam window is closing automatically.":`Leaving fullscreen is a warning. After ${d} warnings the exam closes automatically. Return to fullscreen to continue.`)}else i&&o&&(i.textContent="Fullscreen required",o.textContent="Enter fullscreen to continue the assessment.");ve.wasFullscreen=!1}})}render(){var s;const e=y.getState();(!e.examStarted||e.examCompleted)&&((s=document.getElementById("fullscreen-enforcer-overlay"))==null||s.classList.add("hidden"),ve.stopExamClock()),e.otpVerified?e.systemCheckCompleted?e.examStarted&&!e.examCompleted?(ch(),this.renderExamEngine(),ve.ensureExamClock()):e.examCompleted?(Ua(),this.renderCompletionScreen()):(Ua(),this.renderInstructionsScreen(),!e.assessmentReady&&e.activeCandidateId&&y.loadCandidateAssessment(e.activeAssessmentId)):(Ua(),new Gl(this.container).render().catch(n=>console.error("System check failed to render",n))):(Ua(),this.renderOtpVerification())}renderLanding(){const e=["admin","recruiter","proctor"];this.container.innerHTML=`
      <div class="relative overflow-hidden bg-slate-950 text-slate-100 transition-colors">
        
        <!-- Ambient SaaS Glow / Grid Backdrop -->
        <div class="absolute inset-0 saas-hero-mesh pointer-events-none opacity-80"></div>
        <div class="absolute inset-0 saas-grid-pattern opacity-40 pointer-events-none"></div>

        <!-- Hero Section -->
        <section class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div class="text-center max-w-3xl mx-auto space-y-5">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm border bg-slate-900/80 border-blue-500/20 text-blue-300 backdrop-blur-md">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ConferED Enterprise Talent Assessment & Proctoring</span>
              <span class="opacity-40">•</span>
              <span class="font-mono text-[11px] text-amber-500 font-bold">SOC-2 Type II</span>
            </div>

            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
              Intelligent Talent Assessment & <span class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Live Proctoring</span>
            </h1>

            <p class="text-base sm:text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto">
              A unified enterprise suite by <strong class="font-bold text-orange-500">ConferED</strong> for talent acquisition, university exams, and automated technical evaluations with real-time AI supervision.
            </p>

            <!-- Trust / Feature Indicators -->
            <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-2 text-xs font-medium text-slate-400">
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>🛡️</span> 2FA Enforced IAM
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>⚡</span> Automated Coding IDE
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>👁️</span> Real-Time AI Monitor
              </span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800">
                <span>🔒</span> Zero-Trust Lockdown
              </span>
            </div>
          </div>

          <!-- The 3 Workspaces Grid -->
          <div id="workspaces-section" class="mt-14 lg:mt-16">
            <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                  STAFF WORKSPACES
                </p>
                <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                  Choose your secure workspace
                </h2>
                <p class="text-xs sm:text-sm text-slate-400 mt-1">
                  Sign in with your administrator-provisioned account. Multi-factor email OTP is required on all portals.
                </p>
              </div>
              <div class="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                <span class="w-2 h-2 rounded-full bg-emerald-500"></span> 3 Workspaces Active
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              ${e.map(s=>{const a=ya[s];return`
                  <div class="group relative rounded-3xl border transition-all duration-300 saas-card-hover flex flex-col justify-between p-7 bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-xl">
                    
                    <!-- Ambient Glow Accent on Hover -->
                    <div class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                         style="background:radial-gradient(circle at top, ${a.accentLight}, transparent 70%)"></div>

                    <div class="relative space-y-4">
                      <!-- Card Header & Icon -->
                      <div class="flex items-center justify-between">
                        <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                             style="background:${a.accentLight}; border:1px solid ${a.accentBorder}">
                          ${a.icon}
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full font-mono"
                              style="background:${a.accentLight}; color:${a.accentColor}; border:1px solid ${a.accentBorder}">
                          ${a.badge}
                        </span>
                      </div>

                      <div>
                        <h3 class="text-xl font-bold tracking-tight text-white group-hover:text-blue-500 transition-colors">
                          ${a.name}
                        </h3>
                        <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                          ${a.tagline}
                        </p>
                      </div>

                      <!-- Key Capability Tags -->
                      <div class="pt-2 flex flex-wrap gap-1.5">
                        ${a.features.map(n=>`
                          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950/70 text-slate-300 border border-slate-800">
                            ${n}
                          </span>
                        `).join("")}
                      </div>
                    </div>

                    <!-- Card Action Button -->
                    <div class="relative pt-6 mt-6 border-t border-slate-800">
                      <button type="button" data-portal="${s}"
                              class="w-full py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group-hover:shadow-xl active:scale-[0.98] bg-gradient-to-r ${a.gradient} ${a.hoverGradient}">
                        <span>SIGN IN TO WORKSPACE</span>
                        <span class="transition-transform group-hover:translate-x-1">➔</span>
                      </button>
                    </div>
                  </div>
                `}).join("")}
            </div>
          </div>

          <!-- Enterprise Features Highlights -->
          <div class="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">💻</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Full Monaco Code IDE</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Multi-language coding sandbox with automated test case evaluation and syntax assistance.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">👁️</div>
              <h4 class="text-sm font-bold tracking-tight text-white">AI Vision Proctoring</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Real-time face tracking, multi-person detection, tab-switch interception, and tamper logs.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">🎙️</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Live Voice Intercom</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Direct two-way audio streaming allowing proctors to listen in and issue immediate verbal instructions.</p>
            </div>

            <div class="p-6 rounded-2xl border transition-all bg-slate-900/50 border-slate-800/80">
              <div class="text-2xl mb-3">📊</div>
              <h4 class="text-sm font-bold tracking-tight text-white">Dossier & Audit Trails</h4>
              <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Candidate scoring metrics, violation timeline playback, and exportable PDF audit dossiers.</p>
            </div>
          </div>

        </section>
      </div>
    `,this.container.querySelectorAll("[data-portal]").forEach(s=>{s.addEventListener("click",()=>{const a=s.getAttribute("data-portal");a&&ye.navigate(jt[a].path)})})}renderOtpVerification(){var l;const e=y.getState().candidateInviteToken;if(!e){this.renderLanding();return}this.container.innerHTML=`
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

            <button type="button" id="verify-otp-btn" class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all">
              VERIFY & CONTINUE ➔
            </button>
            <p id="otp-error" class="text-xs font-semibold text-red-400 hidden"></p>
            <p id="otp-info" class="text-xs font-semibold text-emerald-400 hidden"></p>
            <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white">Didn't get a code? Resend</button>
          </div>
        </div>
      </div>
    `;const s=this.container.querySelector("#otp-input"),a=this.container.querySelector("#verify-otp-btn"),n=this.container.querySelector("#otp-error");s==null||s.addEventListener("keydown",d=>{d.key==="Enter"&&(a==null||a.dispatchEvent(new Event("click")))});const i=this.container.querySelector("#otp-info"),o=d=>{i==null||i.classList.add("hidden"),n&&(n.textContent=d,n.classList.remove("hidden"))},r=d=>d instanceof V?d.message:"Something went wrong. Please try again.";a==null||a.addEventListener("click",async()=>{const d=a,c=s.value.replace(/\D/g,"");if(c.length!==6){o("Enter the 6-digit passcode from your email.");return}d.disabled=!0,d.textContent="VERIFYING...";try{const u=await L.candidateVerify(e,c);y.candidateVerified(u)}catch(u){o(r(u)),d.disabled=!1,d.textContent="VERIFY & CONTINUE ➔"}}),(l=this.container.querySelector("#resend-otp-btn"))==null||l.addEventListener("click",async d=>{const c=d.currentTarget;c.disabled=!0;try{const u=await L.candidateResendOtp(e);n==null||n.classList.add("hidden"),i&&(i.textContent="A new passcode was sent to "+u.otpDestination+"."+(u.devOtp?` (DEV OTP: ${u.devOtp})`:""),i.classList.remove("hidden"))}catch(u){o(r(u))}finally{c.disabled=!1}})}renderInstructionsScreen(){var o,r;const e=y.getState(),s=y.getActiveAssessment(),a=e.candidates.find(l=>l.id===e.activeCandidateId),n=e.systemCheckCompleted&&(a==null?void 0:a.identityStatus)!=="approved";if(!e.assessmentReady){this.container.innerHTML=`
        <div class="max-w-md mx-auto py-16 px-4 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your exam paper…</p>
          <p class="text-xs text-slate-400">Fetching sections and questions for this invitation.</p>
          <button id="retry-paper-btn" class="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Retry</button>
        </div>
      `,(o=this.container.querySelector("#retry-paper-btn"))==null||o.addEventListener("click",()=>{y.loadCandidateAssessment(e.activeAssessmentId)});return}const i=(s==null?void 0:s.sections)||[];this.container.innerHTML=`
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
          ${n?`
            <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold">
              Identity is with the proctor. Stay on this screen. Your exam sections are ready below and will open after you are admitted.
            </div>
          `:""}
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div>
              <span class="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Assessment Overview</span>
              <h1 class="text-2xl font-extrabold text-white mt-2">${(s==null?void 0:s.title)||"Technical Assessment"}</h1>
              <p class="text-xs text-slate-400 mt-1">${(s==null?void 0:s.description)||""}</p>
            </div>
            <div class="text-right">
              <div class="text-2xl font-extrabold font-mono text-blue-400">${(s==null?void 0:s.totalDurationMinutes)||0} Mins</div>
              <span class="text-xs text-slate-400 font-medium">Total Duration</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${i.map((l,d)=>`
              <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section ${d+1}</span>
                <h3 class="text-xs font-bold text-white truncate">${l.name}</h3>
                <div class="text-xs font-mono text-blue-400 font-semibold">${l.timeLimitMinutes||0} Mins • ${(l.questions||[]).length} Questions</div>
              </div>
            `).join("")||'<p class="text-xs text-slate-500 col-span-full">No sections are on this paper yet. Ask the recruiter to assign questions in Assessment Builder.</p>'}
          </div>

          ${n?`
            <div class="pt-4 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Waiting for proctor authorization…</span>
            </div>
          `:`
            <div class="pt-4 border-t border-slate-800 flex justify-end">
              <button id="goto-syscheck-btn" class="py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
                <span>PROCEED TO SYSTEM DIAGNOSTICS</span>
                <span>➔</span>
              </button>
            </div>
          `}
        </div>
      </div>
    `,(r=this.container.querySelector("#goto-syscheck-btn"))==null||r.addEventListener("click",()=>{!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),new Gl(this.container).render().catch(d=>console.error("System check failed to render",d))})}renderExamEngine(){var u,h;const e=y.getState(),s=y.getActiveAssessment();if(!e.assessmentReady||!s){this.container.innerHTML=`
        <div class="py-24 text-center space-y-3">
          <p class="text-sm font-bold text-white">Loading your assessment…</p>
          <p class="text-xs text-slate-400">Keep your camera in view. The exam paper will appear in a moment.</p>
          <button id="retry-exam-paper-btn" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">Reload paper</button>
        </div>
      `,(u=this.container.querySelector("#retry-exam-paper-btn"))==null||u.addEventListener("click",()=>{y.loadCandidateAssessment(e.activeAssessmentId)});return}const a=s.sections||[];let n=e.currentSectionIndex;(n<0||n>=a.length)&&(n=0);let i=a[n];if(i&&!(i.questions||[]).length){const p=a.findIndex(f=>(f.questions||[]).length>0);p>=0&&(n=p,i=a[p],e.currentSectionIndex=p,e.currentQuestionIndex=0)}const o=(i==null?void 0:i.questions)||[],r=o[e.currentQuestionIndex]||o[0];if(!i||!r){this.container.innerHTML=`
        <div class="max-w-2xl mx-auto py-16 px-4 space-y-4">
          <h2 class="text-lg font-extrabold text-white">${s.title||"Assessment"}</h2>
          <p class="text-sm text-slate-300">This exam has no questions yet. Reload the paper if the recruiter just assigned questions.</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${a.map((p,f)=>`
              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <p class="text-[10px] font-bold uppercase text-slate-500">Section ${f+1}</p>
                <p class="text-sm font-bold text-white">${p.name}</p>
                <p class="text-xs text-slate-400">${p.timeLimitMinutes||0} mins • ${(p.questions||[]).length} questions</p>
              </div>
            `).join("")}
          </div>
          <button id="retry-empty-paper-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">Reload paper</button>
        </div>
      `,(h=this.container.querySelector("#retry-empty-paper-btn"))==null||h.addEventListener("click",()=>{y.loadCandidateAssessment(e.activeAssessmentId)});return}const l=y.getSectionRemainingSeconds(),d=Jl(l),c=l<120;if(this.container.innerHTML=`
      <div class="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950">
        <!-- Secure Exam Top Navigation Header -->
        <div class="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between sticky top-14 z-30">
          <div class="flex items-center gap-4">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                SECTION ${n+1} OF ${a.length}
              </span>
              <h2 class="text-sm font-bold text-white">${i.name}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                ${a.map((p,f)=>`
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${f===n?"bg-blue-600/20 text-blue-300 border-blue-500/40":f<n?"bg-slate-800 text-slate-500 border-slate-700":"bg-slate-900 text-slate-400 border-slate-800"}">${f+1}. ${p.name} · ${(p.questions||[]).length}q</span>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Section Timer & Section Navigation Controls -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl font-mono">
              <span class="text-xs text-slate-400 uppercase tracking-wider">Section Time:</span>
              <span id="exam-section-timer" class="text-base font-extrabold tabular-nums ${c?"text-red-400 animate-pulse":"text-blue-400"}">${d}</span>
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
                Question ${e.currentQuestionIndex+1} of ${i.questions.length}
              </span>
              <button id="flag-q-btn" class="text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${e.flaggedQuestions.has(r.id)?"bg-amber-500/20 text-amber-300 border-amber-500/40":"bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}">
                🚩 ${e.flaggedQuestions.has(r.id)?"Flagged for Review":"Flag Question"}
              </button>
            </div>

            <div>
              <h3 class="text-lg font-bold text-white tracking-tight">${r.title}</h3>
              <div class="prose prose-invert prose-sm text-slate-300 mt-3 space-y-2 whitespace-pre-line leading-relaxed">
                ${r.content}
              </div>
              ${uh(r)}
            </div>

            <!-- Answer Input Widget based on Question Type -->
            <div class="pt-4 border-t border-slate-800/80">
              ${this.renderAnswerWidget(r,e.candidateAnswers[r.id])}
            </div>

            <!-- Question Navigation Next / Prev Action Bar -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button id="prev-q-btn" ${e.currentQuestionIndex===0?'disabled class="px-4 py-2 rounded-xl bg-slate-900 text-slate-600 border border-slate-800 text-xs font-bold cursor-not-allowed"':'class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"'}>
                ⬅ Previous Question
              </button>

              ${e.currentQuestionIndex<i.questions.length-1?`
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
                ${i.questions.map((p,f)=>{const g=e.candidateAnswers[p.id]!==void 0,m=e.flaggedQuestions.has(p.id),w=f===e.currentQuestionIndex;return`
                    <button data-qidx="${f}" class="q-map-btn w-8 h-8 rounded-lg text-xs font-bold transition-all border ${w?"bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30":m?"bg-amber-500/20 text-amber-300 border-amber-500/40":g?"bg-emerald-500/20 text-emerald-300 border-emerald-500/30":"bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"}">
                      ${f+1}
                    </button>
                  `}).join("")}
              </div>
            </div>
          </div>

          <!-- Right Interactive Code IDE / Essay Workspace -->
          <div class="lg:col-span-7 bg-slate-900/50 p-4 flex flex-col overflow-hidden">
            ${r.type==="coding"||r.type==="sql"?`
              <div id="monaco-container" class="w-full h-full"></div>
            `:r.type==="essay"?(()=>{const p=(e.candidateAnswers[r.id]||"").trim();return`
                  <div class="w-full h-full flex flex-col glass-panel p-5 rounded-2xl border border-slate-800">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Rich Text Essay Response Editor</span>
                      <span id="word-count" class="text-xs font-mono text-blue-400">${p?p.split(/\s+/).filter(Boolean).length:0} / ${r.essayMaxWords||500} words</span>
                    </div>
                    <textarea id="essay-editor" class="flex-1 w-full p-4 glass-input rounded-xl text-sm font-sans text-slate-100 border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 resize-none outline-none" placeholder="Type your response here... (Minimum ${r.essayMinWords||150} words requirement)">${e.candidateAnswers[r.id]||""}</textarea>
                  </div>
                `})():`
              <div class="w-full h-full flex items-center justify-center glass-panel rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Select your answer in the question panel on the left.
              </div>
            `}
          </div>
        </div>

      </div>
    `,r.type==="coding"||r.type==="sql"){const p=this.container.querySelector("#monaco-container");p&&new Vu(p,r).render()}this.attachExamEvents(r)}renderAnswerWidget(e,s){if(e.type==="mcq"||e.type==="msq"){const a=e.options&&e.options.length>0?e.options:[],n=e.type==="msq"||e.selectionMode==="multi",i=n?Array.isArray(s)?s:[]:s;return`
        <div class="space-y-2.5">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${n?"Select all that apply:":"Select one option:"}</span>
          ${a.map((o,r)=>{const l=typeof o=="string"?`opt-${r+1}`:o.id||`opt-${r+1}`,d=typeof o=="string"?o:o.text||`Option ${r+1}`,c=n?i.includes(l):i===l||i===d;return`
              <label class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${c?"bg-blue-600/10 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/20":"bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700"}">
                <input type="${n?"checkbox":"radio"}" name="mcq-option" value="${l}" ${c?"checked":""} class="w-4 h-4 text-blue-600 bg-slate-950 border-slate-700 focus:ring-blue-500" />
                <span class="text-xs font-medium">${d}</span>
              </label>
            `}).join("")}
        </div>
      `}if(e.type==="drag_drop"){const a=[...e.options||[]],n=Array.isArray(s)&&s.length?s:a.map(o=>o.id),i=Object.fromEntries(a.map(o=>[o.id,o]));return`
        <div class="space-y-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Drag items into the correct order:</span>
          <ul id="drag-list" class="space-y-2">
            ${n.map((o,r)=>{var l;return`
              <li draggable="true" data-drag-id="${o}" class="drag-item flex items-center gap-3 p-3.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 cursor-grab active:cursor-grabbing">
                <span class="text-slate-500 font-mono text-[10px] w-5">${r+1}</span>
                <span class="text-xs font-medium flex-1">${((l=i[o])==null?void 0:l.text)||o}</span>
                <span class="text-slate-600 text-sm">⠿</span>
              </li>
            `}).join("")}
          </ul>
        </div>
      `}return""}attachExamEvents(e){var o,r,l,d,c;this.container.querySelectorAll('input[name="mcq-option"]').forEach(u=>{u.addEventListener("change",()=>{if(e.type==="msq"||e.selectionMode==="multi"){const p=Array.from(this.container.querySelectorAll('input[name="mcq-option"]:checked')).map(f=>f.value);y.setAnswer(e.id,p)}else{const p=this.container.querySelector('input[name="mcq-option"]:checked');p&&y.setAnswer(e.id,p.value)}this.renderExamEngine()})});const s=this.container.querySelector("#drag-list");if(s){let u=null;s.querySelectorAll(".drag-item").forEach(h=>{h.addEventListener("dragstart",p=>{var f;u=h,(f=p.dataTransfer)==null||f.setData("text/plain",""),h.classList.add("opacity-50")}),h.addEventListener("dragend",()=>{h.classList.remove("opacity-50"),u=null;const p=Array.from(s.querySelectorAll(".drag-item")).map(f=>f.getAttribute("data-drag-id")||"");y.setAnswer(e.id,p,!1)}),h.addEventListener("dragover",p=>{p.preventDefault();const f=h;if(!u||u===f)return;const g=f.getBoundingClientRect(),m=p.clientY<g.top+g.height/2;s.insertBefore(u,m?f:f.nextSibling)})})}const a=this.container.querySelector("#essay-editor"),n=this.container.querySelector("#word-count");a&&a.addEventListener("input",()=>{const u=a.value,h=u.trim()?u.trim().split(/\s+/).filter(Boolean).length:0;n&&(n.textContent=`${h} / ${e.essayMaxWords||500} words`),y.setAnswer(e.id,u,!1)}),(o=this.container.querySelector("#flag-q-btn"))==null||o.addEventListener("click",()=>{y.toggleFlagQuestion(e.id),this.renderExamEngine()}),this.container.querySelectorAll(".q-map-btn").forEach(u=>{u.addEventListener("click",h=>{const p=parseInt(h.currentTarget.getAttribute("data-qidx")||"0",10);is();const f=y.getState();f.currentQuestionIndex=p,y.flushExamProgress(),this.renderExamEngine()})}),(r=this.container.querySelector("#prev-q-btn"))==null||r.addEventListener("click",()=>{is(),y.prevQuestion(),this.renderExamEngine()}),(l=this.container.querySelector("#next-q-btn"))==null||l.addEventListener("click",()=>{is(),y.nextQuestion(),this.renderExamEngine()});const i=()=>{this.renderCustomSubmitSectionModal()};(d=this.container.querySelector("#finish-sec-btn"))==null||d.addEventListener("click",i),(c=this.container.querySelector("#next-sec-btn"))==null||c.addEventListener("click",i)}renderCustomSubmitSectionModal(){var s,a;const e=document.createElement("div");e.id="sec-confirm-modal",e.innerHTML=`
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
    `,document.body.appendChild(e),(s=e.querySelector("#cancel-sec-modal-btn"))==null||s.addEventListener("click",()=>{e.remove()}),(a=e.querySelector("#confirm-sec-modal-btn"))==null||a.addEventListener("click",()=>{e.remove(),is(),y.nextSection(),!document.fullscreenElement&&document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{}),this.render()})}static stopExamClock(){ve.clockId&&(window.clearInterval(ve.clockId),ve.clockId=0)}static ensureExamClock(){ve.clockId||(ve.clockId=window.setInterval(()=>{const e=y.getState();if(!e.examStarted||e.examCompleted){ve.stopExamClock();return}const s=y.getSectionRemainingSeconds(),a=document.getElementById("exam-section-timer");a&&(a.textContent=Jl(s),a.classList.toggle("text-red-400",s<120),a.classList.toggle("animate-pulse",s<120),a.classList.toggle("text-blue-400",s>=120)),s<=0&&(is(),y.nextSection())},250))}renderCompletionScreen(){const s=y.getState().candidateFeedback!==null,a=this.selectedRating>=1;this.container.innerHTML=`
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
          ${s?`
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
                ${[1,2,3,4,5].map(n=>`
                  <button type="button" data-star="${n}" class="star-btn text-3xl transition-transform hover:scale-125 focus:outline-none ${n<=this.selectedRating?"text-amber-400":"text-slate-700"}">
                    ★
                  </button>
                `).join("")}
              </div>
              <p class="text-center text-[11px] text-slate-500">A star rating is required.</p>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Comments (optional):</label>
                <textarea id="feedback-text" rows="3" class="w-full p-3 glass-input rounded-xl text-xs text-white border border-slate-700 bg-slate-950 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional comments">${this.feedbackDraft.replace(/</g,"&lt;")}</textarea>
              </div>

              <button id="submit-feedback-btn" type="button" ${a?"":"disabled"} class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all ${a?"hover:from-blue-500 hover:to-indigo-500":"opacity-50 cursor-not-allowed"}">
                SUBMIT AND EXIT
              </button>
            </div>
          `}

          <div class="pt-4 border-t border-slate-800">
            <p class="text-xs text-slate-500 font-mono">Reference Submission ID: SUB-2026-98412-SEC</p>
          </div>
        </div>
      </div>
    `,this.attachFeedbackEvents()}attachFeedbackEvents(){var s,a;(s=this.container.querySelector("#exit-fullscreen-close-tab-btn"))==null||s.addEventListener("click",()=>{Wl()}),(a=this.container.querySelector("#feedback-text"))==null||a.addEventListener("input",n=>{this.feedbackDraft=n.currentTarget.value}),this.container.querySelectorAll(".star-btn").forEach(n=>{n.addEventListener("click",i=>{const o=parseInt(i.currentTarget.getAttribute("data-star")||"0",10),r=this.container.querySelector("#feedback-text");this.feedbackDraft=(r==null?void 0:r.value)||this.feedbackDraft,this.selectedRating=o,this.renderCompletionScreen()})});const e=this.container.querySelector("#submit-feedback-btn");e==null||e.addEventListener("click",()=>{if(this.selectedRating<1)return;const n=this.container.querySelector("#feedback-text"),i=n?n.value.trim():this.feedbackDraft.trim();e.setAttribute("disabled","true"),y.finishAndClose(this.selectedRating,i),Wl()})}};b(ve,"clockId",0),b(ve,"fullscreenEnforcementBound",!1),b(ve,"wasFullscreen",!1);let vn=ve;function uh(t){if(t.type!=="coding"&&t.type!=="sql")return"";const e=(t.constraints||"").trim(),s=(t.ioFormat||"").trim();if(!e&&!s)return"";const a=(n,i)=>i?`
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
      <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${n}</p>
      <p class="text-xs text-slate-200 mt-1 whitespace-pre-line">${ph(i)}</p>
    </div>`:"";return`<div class="mt-4 space-y-2">${a("Constraints",e)}${a("Input / Output format",s)}</div>`}function ph(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Wl(){try{sessionStorage.removeItem("confered.candidateToken"),sessionStorage.removeItem("confered.examSnapshot")}catch{}document.fullscreenElement&&document.exitFullscreen&&document.exitFullscreen().catch(()=>{}),window.open("","_self"),window.close()}function hh(){var s,a;const t=document.getElementById("fullscreen-enforcer-overlay"),e=(a=(s=document.documentElement).requestFullscreen)==null?void 0:a.call(s);if(!e){t==null||t.classList.remove("hidden");return}e.catch(()=>t==null?void 0:t.classList.remove("hidden"))}const fh=Object.freeze(Object.defineProperty({__proto__:null,CandidatePortalModule:vn,requestExamFullscreen:hh},Symbol.toStringTag,{value:"Module"})),va={},Ea={},nn={},Ys={};let gu="",ur="",ha=null,Tt=null,vu="",Va=0,vt=null;const zi=new Set;function bh(t){return`${L.apiBase.replace(/^http/,"ws")}/ws/proctoring?token=${encodeURIComponent(t)}`}function hs(){zi.forEach(t=>t())}function mh(t){const e=window.AudioContext||window.webkitAudioContext;if(!e)return;vt||(vt=new e({sampleRate:16e3})),vt.resume().catch(()=>{});const s=Uint8Array.from(atob(t),l=>l.charCodeAt(0)),a=new Int16Array(s.buffer,s.byteOffset,Math.floor(s.byteLength/2)),n=vt.createBuffer(1,a.length,16e3),i=n.getChannelData(0);for(let l=0;l<a.length;l++)i[l]=a[l]/32768;const o=vt.createBufferSource();o.buffer=n,o.connect(vt.destination);const r=vt.currentTime;Va<r&&(Va=r+.02),o.start(Va),Va+=n.duration}function yu(){const t=L.getStaffToken();!t||Tt&&Tt.readyState<=WebSocket.OPEN||(Tt=new WebSocket(bh(t)),Tt.onmessage=e=>{const s=JSON.parse(e.data);if(s.type==="inbox"&&s.threads)Object.assign(va,s.threads),hs();else if(s.type==="chat"&&s.candidateId){const a=va[s.candidateId]||(va[s.candidateId]=[]);a.some(n=>n.at===s.at&&n.text===s.text&&n.from===s.from)||(a.push({from:s.from,text:s.text,at:s.at}),s.from==="candidate"&&gu!==s.candidateId&&(Ys[s.candidateId]=(Ys[s.candidateId]||0)+1)),hs()}else s.type==="session_ended"?hs():s.type==="frame"&&s.candidateId&&typeof s.image=="string"?(Ea[s.candidateId]=s.image,document.querySelectorAll(`[data-live-frame="${s.candidateId}"]`).forEach(a=>{a.src=s.image,a.classList.remove("hidden")})):s.type==="mic"&&s.candidateId===vu&&typeof s.pcm=="string"?mh(s.pcm):s.type==="PROCTORING_EVENT"&&s.candidateId&&(nn[s.candidateId]=Number(s.violations||0),hs())},Tt.onclose=()=>{Tt=null})}function wu(t){return zi.add(t),()=>zi.delete(t)}function pr(t){!Tt||Tt.readyState!==WebSocket.OPEN||Tt.send(JSON.stringify(t))}function mi(t){vu=t,vt==null||vt.resume().catch(()=>{})}function Ki(t){gu=t,t&&(Ys[t]=0),hs()}function fs(t){return ur===t}function yn(){ha==null||ha(),ha=null,ur="",hs()}async function Su(t){yn();const e=await navigator.mediaDevices.getUserMedia({audio:!0,video:!1}),s=new AudioContext({sampleRate:16e3}),a=s.createMediaStreamSource(e),n=s.createScriptProcessor(2048,1,1),i=s.createGain();i.gain.value=0,n.onaudioprocess=o=>{const r=o.inputBuffer.getChannelData(0),l=new Int16Array(r.length);for(let u=0;u<r.length;u++){const h=Math.max(-1,Math.min(1,r[u]));l[u]=h<0?h*32768:h*32767}const d=new Uint8Array(l.buffer);let c="";for(let u=0;u<d.length;u++)c+=String.fromCharCode(d[u]);pr({type:"audio",candidateId:t,pcm:btoa(c)})},a.connect(n),n.connect(i),i.connect(s.destination),ur=t,ha=()=>{n.disconnect(),a.disconnect(),e.getTracks().forEach(o=>o.stop()),s.close().catch(()=>{})},hs()}const Ql={aadhaar:"Aadhaar",pan:"PAN card",voter_id:"Voter ID"},Vt=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);async function zl(t,e){const s=L.getStaffToken(),a=await fetch(`${L.apiBase}/api/v1/proctor/identity/${t}/${e}.jpg`,{headers:s?{Authorization:`Bearer ${s}`}:{}});if(!a.ok)throw new Error("missing");return URL.createObjectURL(await a.blob())}class xh{constructor(e){b(this,"container");b(this,"items",[]);b(this,"photos",{});b(this,"error","");b(this,"openChat","");b(this,"tab","pending");b(this,"stopWatch",null);this.container=e,this.stopWatch=wu(()=>{this.items.length&&this.paint()})}render(){if(yu(),!this.items.length&&!this.error){this.container.innerHTML='<p class="text-xs text-slate-400">Loading candidates who uploaded a photo or ID...</p>',this.load().catch(e=>{this.error=e instanceof Error?e.message:"Could not load the identity queue.",this.paint()});return}this.paint()}async load(){const e=await L.fetchJson("/proctor/identity","GET",void 0,"staff");this.items=e.items,await Promise.all(e.items.map(async s=>{const a=this.photos[s.id]||(this.photos[s.id]={});s.hasPhoto&&!a.face&&(a.face=await zl(s.id,"photo").catch(()=>"")),s.hasId&&!a.id&&(a.id=await zl(s.id,"id").catch(()=>""))})),this.paint()}paint(){const e=this.items.filter(s=>this.tab==="pending"?s.identityStatus!=="approved":s.identityStatus==="approved");this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="border-b border-slate-800 pb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-white">Candidate photo and government ID</h2>
            <p class="text-xs text-slate-400 mt-1">Pending candidates can be admitted. Completed candidates move to live monitoring.</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-tab="pending" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab==="pending"?"bg-blue-600 text-white":"bg-slate-800 text-slate-300"}">Pending</button>
            <button type="button" data-tab="completed" class="px-3 py-1.5 rounded-lg text-xs font-bold ${this.tab==="completed"?"bg-blue-600 text-white":"bg-slate-800 text-slate-300"}">Completed</button>
          </div>
        </div>
        ${this.error?`<p class="text-xs text-red-400">${Vt(this.error)}</p>`:""}
        ${e.length===0?`<p class="text-xs text-slate-500">${this.tab==="pending"?"No one is waiting.":"No one has been admitted yet."}</p>`:""}
        <div class="space-y-6">
          ${e.map(s=>this.tab==="pending"?this.pendingCard(s):this.completedCard(s)).join("")}
        </div>
      </div>
    `,this.bind()}pendingCard(e){const s=this.photos[e.id]||{},a=e.idDocumentType?Ql[e.idDocumentType]||e.idDocumentType:"Government ID",n=va[e.id]||[];return`
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-white">${Vt(e.name)}</h3>
            <p class="text-xs text-slate-300">${Vt(e.examTitle||"Assessment")}</p>
            <p class="text-xs text-slate-400">${Vt(e.email)}</p>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase bg-amber-500/20 text-amber-400">Pending</span>
        </div>
        <div class="space-y-1">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Live camera</span>
          <div class="relative w-full max-w-sm aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            ${Ea[e.id]?`<img data-live-frame="${e.id}" src="${Ea[e.id]}" alt="" class="w-full h-full object-cover" />`:`<img data-live-frame="${e.id}" alt="" class="w-full h-full object-cover hidden" /><div class="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">Waiting for the candidate camera</div>`}
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot("Live photo",s.face)}
          ${this.shot(a,s.id)}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-admit="${e.id}" class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
            Approve and admit
          </button>
          <button data-talk="${e.id}" class="px-4 py-2 rounded-xl text-xs font-bold border ${fs(e.id)?"bg-red-600 text-white border-red-500":"bg-purple-600/20 text-purple-300 border-purple-500/40"}">
            ${fs(e.id)?"Stop speaking":"Speak to candidate"}
          </button>
          <button data-chat="${e.id}" class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
            Chat
            ${Ys[e.id]?`<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${Ys[e.id]}</span>`:""}
          </button>
        </div>
        ${this.openChat===e.id?`
          <div class="rounded-xl border border-slate-800 bg-slate-950">
            <div class="h-40 overflow-y-auto p-3 space-y-2 text-xs" data-log="${e.id}">
              ${n.map(i=>`<div class="${i.from==="proctor"?"text-right":""}"><span class="inline-block px-2 py-1 rounded-lg ${i.from==="proctor"?"bg-purple-600 text-white":"bg-slate-800 text-slate-100"}">${Vt(i.text)}</span></div>`).join("")||'<p class="text-slate-500">No messages yet.</p>'}
            </div>
            <form data-send="${e.id}" class="flex gap-2 p-2 border-t border-slate-800">
              <input data-input="${e.id}" class="flex-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white" placeholder="Message the candidate" />
              <button class="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold" type="submit">Send</button>
            </form>
          </div>
        `:""}
      </div>
    `}completedCard(e){const s=this.photos[e.id]||{},a=e.idDocumentType?Ql[e.idDocumentType]||e.idDocumentType:"Government ID";return`
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div>
          <h3 class="text-sm font-bold text-white">${Vt(e.name)}</h3>
          <p class="text-xs text-slate-400">${Vt(e.examTitle||"Assessment")}</p>
        </div>
        <div class="flex flex-wrap gap-4">
          ${this.shot("Live photo",s.face)}
          ${this.shot(a,s.id)}
        </div>
      </div>
    `}shot(e,s){return`
      <div class="space-y-1">
        <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">${Vt(e)}</span>
        ${s?`<img src="${s}" class="w-40 h-28 rounded-xl object-cover border border-slate-700 bg-slate-950" />`:'<div class="w-40 h-28 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 text-xs">No image</div>'}
      </div>
    `}bind(){this.container.querySelectorAll("[data-tab]").forEach(e=>{e.addEventListener("click",()=>{this.tab=e.getAttribute("data-tab")||"pending",this.paint()})}),this.container.querySelectorAll("[data-admit]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-admit");s&&L.fetchJson(`/proctor/identity/${s}/admit`,"POST",{},"staff").then(()=>this.load()).catch(a=>{this.error=a instanceof Error?a.message:"Could not admit the candidate.",this.paint()})})}),this.container.querySelectorAll("[data-talk]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-talk")||"";fs(s)?yn():Su(s)})}),this.container.querySelectorAll("[data-chat]").forEach(e=>{e.addEventListener("click",()=>{const s=e.getAttribute("data-chat")||"";this.openChat=this.openChat===s?"":s,Ki(this.openChat)})}),this.container.querySelectorAll("[data-send]").forEach(e=>{e.addEventListener("submit",s=>{s.preventDefault();const a=e.getAttribute("data-send")||"",n=e.querySelector("input"),i=(n==null?void 0:n.value.trim())||"";i&&(pr({type:"chat",candidateId:a,text:i}),n&&(n.value=""))})})}}const $e=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);function gh(t){const e=Math.max(0,t),s=Math.floor(e/60),a=e%60;return`${String(s).padStart(2,"0")}:${String(a).padStart(2,"0")}`}function xi(t){if(!t.examStarted)return"Admitted (Ready to start)";const e=t.deadlineMs==null?t.timeLeftSeconds:Math.max(0,Math.round((t.deadlineMs-Date.now())/1e3));return`Time left ${gh(e)}`}const ds=class ds{constructor(e){b(this,"container");b(this,"items",[]);b(this,"jobs",[]);b(this,"filterJobId","");b(this,"listening",null);b(this,"chatOpen",!1);b(this,"timer",null);b(this,"tickTimer",null);b(this,"stopWatch",null);ds.current&&ds.current!==this&&ds.current.stop(),ds.current=this,this.container=e}render(){var e;if(Fs("proctor")==="identity-verification"){this.stop(),this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="proctor-section"></div></div>',new xh(this.container.querySelector("#proctor-section")).render();return}yu(),this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <p class="text-xs text-slate-400">Loading admitted candidates...</p>
      </div>
    `,this.load().catch(()=>this.paint("Could not load live sessions.")),this.timer||(this.timer=window.setInterval(()=>this.load().catch(()=>{}),5e3)),this.tickTimer||(this.tickTimer=window.setInterval(()=>this.tickClocks(),1e3)),(e=this.stopWatch)==null||e.call(this),this.stopWatch=wu(()=>{this.load().catch(()=>{})})}stop(){var e;this.timer&&window.clearInterval(this.timer),this.timer=null,this.tickTimer&&window.clearInterval(this.tickTimer),this.tickTimer=null,(e=this.stopWatch)==null||e.call(this),this.stopWatch=null,mi("")}tickClocks(){this.container.querySelectorAll("[data-clock]").forEach(e=>{const s=e.getAttribute("data-clock")||"",a=this.items.find(n=>n.id===s);a&&(e.textContent=xi(a))})}async load(){const e=await L.fetchJson("/proctor/live","GET",void 0,"staff"),s=Date.now();this.items=(e.items||[]).map(a=>({...a,jobId:a.jobId||"",jobTitle:a.jobTitle||a.examTitle||"General Assessment",examStarted:!!a.examStarted,deadlineMs:a.examStarted?s+Math.max(0,a.timeLeftSeconds)*1e3:null,violations:Math.max(a.violations,nn[a.id]||0)})),this.jobs=e.jobs||[],this.paint()}paint(e=""){var i,o,r,l,d,c,u;if(Fs("proctor")==="identity-verification")return;const s=this.filterJobId?this.items.filter(h=>h.jobId===this.filterJobId):this.items,a=this.filterJobId?((i=this.jobs.find(h=>h.id===this.filterJobId))==null?void 0:i.title)||((o=this.items.find(h=>h.jobId===this.filterJobId))==null?void 0:o.jobTitle)||"Selected Role":"",n=[];if(!this.filterJobId){const h={};for(const p of s){const f=p.jobTitle||"General Assessment";h[f]||(h[f]=[]),h[f].push(p)}for(const[p,f]of Object.entries(h))n.push({title:p,items:f})}this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Banner Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Proctor Surveillance Engine
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Live Candidate Monitor</h1>
            <p class="text-xs text-slate-400">
              Real-time candidate camera feeds and AI integrity tracking for active admitted exam sessions.
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full ${s.length>0?"bg-emerald-400 animate-pulse":"bg-slate-500"}"></span>
              Live Feeds: <b class="${s.length>0?"text-emerald-400":"text-slate-400"} font-bold">${s.length}</b>
            </span>
          </div>
        </div>

        <!-- Filter by Job Section -->
        ${this.jobs.length>0?`
          <div class="flex flex-wrap gap-2 items-center bg-slate-900/50 p-2.5 rounded-2xl border border-slate-800/80">
            <span class="text-xs text-slate-400 font-semibold mr-1 pl-1">Filter by Job:</span>
            <button data-job-filter="" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${this.filterJobId?"bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700":"bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30"}">
              All Jobs (${this.items.length})
            </button>
            ${this.jobs.map(h=>{const p=this.items.filter(f=>f.jobId===h.id).length;return`
                <button data-job-filter="${$e(h.id)}" class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${this.filterJobId===h.id?"bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/30":"bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"}">
                  ${$e(h.title)} (${p})
                </button>
              `}).join("")}
          </div>
        `:""}

        ${e?`<p class="text-xs text-red-400 font-semibold">${$e(e)}</p>`:""}

        <!-- Feeds Grid or Empty State -->
        ${s.length===0?`
          <div class="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div class="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
              📹
            </div>
            <h3 class="text-base font-bold text-slate-200">No Active Live Feeds</h3>
            <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              ${this.filterJobId?`There are no admitted candidates currently taking the exam for <strong>${$e(a)}</strong>.`:"Candidates will appear here in real-time once admitted from <strong>Identity & ID Verification</strong> and their exam begins. Completed exams automatically exit this monitor."}
            </p>
            <div class="pt-2">
              <button id="go-identity-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all">
                Go to Identity & ID Verification ➔
              </button>
            </div>
          </div>
        `:this.filterJobId?`
          <!-- Single Selected Job Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">💼</span>
                <h2 class="text-base font-bold text-white">${$e(a)}</h2>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ${s.length} Live ${s.length===1?"Feed":"Feeds"}
                </span>
              </div>
              <span class="text-xs text-slate-400 font-mono">Job-Specific Live Monitoring</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${s.map(h=>this.card(h)).join("")}
            </div>
          </div>
        `:`
          <!-- Grouped by Job Sections -->
          <div class="space-y-8">
            ${n.map(h=>`
              <div class="space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-base">💼</span>
                    <h2 class="text-base font-bold text-white">${$e(h.title)}</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      ${h.items.length} Live ${h.items.length===1?"Feed":"Feeds"}
                    </span>
                  </div>
                  <span class="text-xs text-slate-400 font-mono">${h.items.filter(p=>p.examStarted).length} actively in test</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${h.items.map(p=>this.card(p)).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        `}

        ${this.listening?this.popup(this.listening):""}
      </div>
    `,this.container.querySelectorAll("[data-job-filter]").forEach(h=>{h.addEventListener("click",p=>{this.filterJobId=p.currentTarget.getAttribute("data-job-filter")||"",this.paint()})}),(r=this.container.querySelector("#go-identity-btn"))==null||r.addEventListener("click",()=>{Gu("proctor","identity-verification"),ye.navigate(Aa("proctor","identity-verification")),this.render()}),this.container.querySelectorAll("[data-open-live]").forEach(h=>{h.addEventListener("click",()=>{const p=h.getAttribute("data-open-live")||"";this.listening=this.items.find(f=>f.id===p)||null,mi(p),this.paint()})}),(l=this.container.querySelector("#close-live-popup"))==null||l.addEventListener("click",()=>{this.listening&&fs(this.listening.id)&&yn(),this.listening=null,this.chatOpen=!1,mi(""),Ki(""),this.paint()}),(d=this.container.querySelector("[data-live-talk]"))==null||d.addEventListener("click",()=>{var p;const h=((p=this.listening)==null?void 0:p.id)||"";h&&(fs(h)?yn():Su(h))}),(c=this.container.querySelector("[data-live-chat]"))==null||c.addEventListener("click",()=>{this.chatOpen=!this.chatOpen,Ki(this.chatOpen&&this.listening?this.listening.id:""),this.paint()}),(u=this.container.querySelector("#live-chat-form"))==null||u.addEventListener("submit",h=>{h.preventDefault();const p=this.container.querySelector("#live-chat-input"),f=(p==null?void 0:p.value.trim())||"";!f||!this.listening||(pr({type:"chat",candidateId:this.listening.id,text:f}),p&&(p.value=""))})}card(e){const s=Ea[e.id],a=Math.max(e.violations,nn[e.id]||0);return`
      <button type="button" data-open-live="${e.id}" class="text-left glass-panel p-4 rounded-3xl border ${a?"border-amber-500/50 hover:border-amber-500":"border-slate-800 hover:border-blue-500/50"} space-y-3 transition-all group hover:shadow-xl hover:shadow-blue-500/5">
        <div class="relative w-full aspect-video rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          ${s?`<img data-live-frame="${e.id}" src="${s}" alt="" class="absolute inset-0 w-full h-full object-cover" />`:`<img data-live-frame="${e.id}" alt="" class="absolute inset-0 w-full h-full object-cover hidden" />
               <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-1.5">
                 <span class="text-xl">📹</span>
                 <span>Waiting for camera feed</span>
               </div>`}
          <!-- Top Tag Overlay -->
          <div class="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span class="text-[10px] font-bold bg-slate-950/85 text-blue-300 border border-slate-700/60 px-2 py-0.5 rounded truncate max-w-[55%]">
              💼 ${$e(e.jobTitle||e.examTitle||"Assessment")}
            </span>
            ${e.examStarted?`
              <span class="text-[10px] font-bold bg-emerald-950/85 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Exam
              </span>
            `:`
              <span class="text-[10px] font-bold bg-blue-950/85 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded">
                Admitted
              </span>
            `}
          </div>

          <!-- Bottom Tag Overlay -->
          <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[11px] font-mono pointer-events-none">
            <span data-clock="${e.id}" class="bg-slate-950/85 text-slate-200 border border-slate-800 px-2 py-0.5 rounded">
              ${xi(e)}
            </span>
            ${a>0?`
              <span class="bg-red-950/90 text-red-200 border border-red-500/50 px-2 py-0.5 rounded font-bold">
                ⚠ Violations ${a}
              </span>
            `:`
              <span class="bg-slate-950/85 text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                0 Violations
              </span>
            `}
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">${$e(e.name)}</h3>
          <p class="text-xs text-slate-400 mt-0.5">${$e(e.jobTitle||e.examTitle||"Assessment")}</p>
          <p class="text-[11px] text-slate-500 font-mono truncate mt-0.5">${$e(e.email)}</p>
        </div>

        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Monitor candidate</span>
          <span class="text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">Open Feed ➔</span>
        </div>
      </button>
    `}popup(e){const s=Ea[e.id],a=va[e.id]||[],n=Ys[e.id]||0,i=Math.max(e.violations,nn[e.id]||0);return`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-white">${$e(e.name)}</h2>
                <span class="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  ${$e(e.jobTitle||e.examTitle||"Assessment")}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">
                <span data-clock="${e.id}">${xi(e)}</span> •
                <span class="${i?"text-red-400 font-bold":"text-slate-400"}">Violations: ${i}</span>
              </p>
            </div>
            <button id="close-live-popup" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200" type="button">
              ✕ Close
            </button>
          </div>

          <div class="relative w-full aspect-video rounded-2xl bg-slate-900 overflow-hidden border border-slate-800">
            ${s?`<img data-live-frame="${e.id}" src="${s}" alt="" class="w-full h-full object-cover" />`:`<div class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                   <span class="text-2xl">📹</span>
                   <span>Waiting for candidate camera stream</span>
                 </div>`}
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span class="font-semibold text-emerald-400 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Microphone Audio Stream Active
            </span>
            <span class="text-slate-400 font-mono text-[11px]">${$e(e.email)}</span>
          </div>

          <div class="flex flex-wrap gap-2 pt-1">
            <button type="button" data-live-talk class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${fs(e.id)?"bg-red-600 text-white shadow-lg shadow-red-600/30":"bg-purple-600/20 text-purple-200 border border-purple-500/40 hover:bg-purple-600 hover:text-white"}">
              ${fs(e.id)?"🔴 Stop Speaking":"🎙️ Speak to Candidate"}
            </button>
            <button type="button" data-live-chat class="relative px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
              💬 Candidate Chat
              ${n?`<span class="absolute -top-2 -right-2 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[1.15rem]">${n}</span>`:""}
            </button>
          </div>

          ${this.chatOpen?`
            <div class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden">
              <div class="p-2.5 border-b border-slate-800 bg-slate-900 text-[11px] font-bold text-slate-300">
                Direct Proctor Chat with ${$e(e.name)}
              </div>
              <div class="h-36 overflow-y-auto p-3 space-y-2 text-xs">
                ${a.map(o=>`
                  <div class="${o.from==="proctor"?"text-right":""}">
                    <span class="inline-block px-3 py-1.5 rounded-xl ${o.from==="proctor"?"bg-purple-600 text-white":"bg-slate-800 text-slate-100"}">
                      ${$e(o.text)}
                    </span>
                  </div>
                `).join("")||'<p class="text-slate-500 text-center py-4">No messages yet. Send a prompt to the candidate.</p>'}
              </div>
              <form id="live-chat-form" class="flex gap-2 p-2 border-t border-slate-800 bg-slate-950">
                <input id="live-chat-input" class="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500" placeholder="Type a message to the candidate..." />
                <button class="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors" type="submit">Send</button>
              </form>
            </div>
          `:""}
        </div>
      </div>
    `}};b(ds,"current",null);let Yi=ds;class ku{static downloadCsv(e,s,a){const n=[s.map(l=>`"${l}"`).join(","),...a.map(l=>l.map(d=>`"${String(d).replace(/"/g,'""')}"`).join(","))].join(`
`),i=new Blob([n],{type:"text/csv;charset=utf-8;"}),o=URL.createObjectURL(i),r=document.createElement("a");r.setAttribute("href",o),r.setAttribute("download",e),r.style.visibility="hidden",document.body.appendChild(r),r.click(),document.body.removeChild(r)}}class Xi{static recordInvite(e,s,a,n,i){const o=(i==null?void 0:i.assessmentTitle)||"Assessment",r=(i==null?void 0:i.durationMinutes)??60,l={id:`email-${Date.now()}`,recipientEmail:s,recipientName:e,subject:`Invitation: ${o}`,bodyText:`Hello ${e}, you have been invited to ${o} (${r} min). Link: ${a}`,bodyHtml:"",otpCode:n||void 0,assessmentLink:a,assessmentTitle:o,durationMinutes:r,expiresAt:i==null?void 0:i.expiresAt,sentAt:new Date().toLocaleString(),status:"Delivered",provider:"Gmail SMTP (server-side)"};return this.sentEmails.unshift(l),l}static async sendTestEmail(e){const s="NexusAssess SMTP test",a="<p>This is a test email from the NexusAssess admin console.</p>",n={id:`email-${Date.now()}`,recipientEmail:e,recipientName:"Admin",subject:s,bodyText:"SMTP test email",bodyHtml:a,sentAt:new Date().toLocaleString(),status:"Delivering",provider:"Gmail SMTP (server-side)"};this.sentEmails.unshift(n);try{const i=await L.fetchJson("/recruiter/send-email","POST",{recipientEmail:e,recipientName:"Admin",subject:s,bodyHtml:a});return n.status=i.status==="success"?"Delivered":"Sent",i.status==="success"}catch{return n.status="Failed",!1}}static getSentEmails(){return this.sentEmails}}b(Xi,"sentEmails",[]);const Kl=[{status:"Applied",slug:"applied",countKey:"applied"},{status:"Screened",slug:"screened",countKey:"screened"},{status:"Assessment Sent",slug:"assessment-sent",countKey:"assessmentSent"},{status:"Completed",slug:"completed",countKey:"completed"},{status:"Under Review",slug:"under-review",countKey:"underReview"},{status:"Selected",slug:"selected",countKey:"selected"},{status:"Rejected",slug:"rejected",countKey:"rejected"}],Se=t=>L.fetchJson(t,"GET"),Xe=(t,e)=>L.fetchJson(t,"POST",e),Yl=(t,e)=>L.fetchJson(t,"PUT",e),Ga=(t,e)=>L.fetchJson(t,"PATCH",e),As=t=>L.fetchJson(t,"DELETE"),D={pipeline:t=>{const e=t?`?job_id=${encodeURIComponent(t)}`:"";return Se(`/recruiter/pipeline${e}`)},pipelineStage:(t,e)=>{const s=e?`?job_id=${encodeURIComponent(e)}`:"";return Se(`/recruiter/pipeline/stages/${t}${s}`)},candidate:t=>Se(`/recruiter/candidates/${t}`),setDecision:(t,e,s)=>Ga(`/recruiter/candidates/${t}/decision`,{decision:e,notes:s}),jobs:()=>Se("/recruiter/jobs"),job:t=>Se(`/recruiter/jobs/${t}`),createJob:t=>Xe("/recruiter/jobs",t),updateJob:(t,e)=>Ga(`/recruiter/jobs/${t}`,e),deleteJob:t=>As(`/recruiter/jobs/${t}`),jobCategories:t=>Se(`/recruiter/jobs/${t}/categories`),createJobCategory:(t,e)=>Xe(`/recruiter/jobs/${t}/categories`,{label:e}),createCategory:t=>Xe("/recruiter/question-categories",{label:t}),createJobSection:(t,e)=>Xe(`/recruiter/jobs/${t}/sections`,e),deleteJobCategory:(t,e)=>As(`/recruiter/jobs/${t}/categories/${e}`),jobQuestions:(t,e)=>{const s=new URLSearchParams;e!=null&&e.category&&s.set("category",e.category),e!=null&&e.type&&s.set("type",e.type);const a=s.toString()?`?${s}`:"";return Se(`/recruiter/jobs/${t}/questions${a}`)},createJobQuestion:(t,e)=>Xe(`/recruiter/jobs/${t}/questions`,e),assessments:()=>Se("/recruiter/assessments"),assessment:t=>Se(`/recruiter/assessments/${t}`),createAssessment:t=>Xe("/recruiter/assessments",t),updateAssessment:(t,e)=>Ga(`/recruiter/assessments/${t}`,e),deleteAssessment:t=>As(`/recruiter/assessments/${t}`),questions:t=>{const e=new URLSearchParams;t!=null&&t.category&&e.set("category",t.category),t!=null&&t.type&&e.set("type",t.type),t!=null&&t.difficulty&&e.set("difficulty",t.difficulty),t!=null&&t.q&&e.set("q",t.q),t!=null&&t.jobRole&&e.set("jobRole",t.jobRole),t!=null&&t.jobId&&e.set("jobId",t.jobId),t!=null&&t.scope&&e.set("scope",t.scope);const s=e.toString()?`?${e}`:"";return Se(`/recruiter/questions${s}`)},questionCategories:()=>Se("/recruiter/question-categories"),jobRoles:()=>Se("/recruiter/job-roles"),createJobRole:t=>Xe("/recruiter/job-roles",t),deleteJobRole:t=>As(`/recruiter/job-roles/${t}`),questionBanks:()=>Se("/recruiter/question-banks"),createQuestionBank:t=>Xe("/recruiter/question-banks",t),updateQuestionBank:(t,e)=>Yl(`/recruiter/question-banks/${t}`,e),deleteQuestionBank:t=>As(`/recruiter/question-banks/${t}`),question:t=>Se(`/recruiter/questions/${t}`),createQuestion:t=>Xe("/recruiter/questions",t),updateQuestion:(t,e)=>Ga(`/recruiter/questions/${t}`,e),deleteQuestion:t=>As(`/recruiter/questions/${t}`),bulkImportQuestions:async(t,e)=>{const s=new FormData;return s.append("file",t),e&&s.append("jobId",e),L.uploadForm("/recruiter/questions/bulk/import",s)},downloadQuestionSample:()=>{const t=["Question,Section,Category,Content,Difficulty,Points,Options,CorrectAnswer,Job","What is 2+2?,Quantitative Aptitude,MCQ,Select the correct sum,easy,5,3|4|5|6,2,","Which figure comes next?,Logical Reasoning,MCQ,Choose the next figure in the series,medium,5,Circle|Square|Triangle,2,","Choose the correct sentence,English,MCQ,Pick the grammatically correct sentence,easy,5,He go home|He goes home|He going home,2,","What does JVM stand for?,Technical,MCQ,Choose the right expansion,easy,5,Java Virtual Machine|Java Variable Method|Just Virtual Memory,1,","Reverse a string,Technical,Coding,Write a function that returns the reversed string,medium,20,,,"].join(`
`),e=new Blob([t],{type:"text/csv;charset=utf-8"}),s=URL.createObjectURL(e),a=document.createElement("a");a.href=s,a.download="question_bank_sample.csv",a.click(),URL.revokeObjectURL(s)},updateSection:(t,e,s)=>Yl(`/recruiter/assessments/${t}/sections/${e}`,s),eligibleQuestions:(t,e,s)=>{const a=s?`?q=${encodeURIComponent(s)}`:"";return Se(`/recruiter/assessments/${t}/sections/${e}/eligible-questions${a}`)},attachSectionQuestions:(t,e,s)=>Xe(`/recruiter/assessments/${t}/sections/${e}/questions`,{questionIds:s}),bulkPreview:async(t,e)=>{const s=new FormData;return s.append("file",e),L.uploadForm(`/recruiter/assessments/${t}/invites/bulk/preview`,s)},bulkConfirm:(t,e)=>Xe(`/recruiter/invites/batches/${t}/confirm`,e),bulkStatus:t=>Se(`/recruiter/invites/batches/${t}`),bulkRetryFailed:t=>Xe(`/recruiter/invites/batches/${t}/retry-failed`)},Xl="confered_question_banks",$u={id:"qb-default",name:"Default Question Bank",description:"Default repository containing all questions, MCQs, and coding challenges across all jobs.",jobId:null,jobTitle:null,createdAt:new Date().toISOString(),badgeTone:"from-blue-600 to-indigo-600",isDefault:!0},Zl=[$u];class vh{constructor(){b(this,"banks",[]);b(this,"syncedWithBackend",!1);this.init(),this.syncFromBackend()}init(){try{const e=localStorage.getItem(Xl);if(e){const s=JSON.parse(e);if(Array.isArray(s)&&s.length>0){this.banks=this.ensureDefaultBank(s);return}}}catch{}this.banks=[...Zl],this.persist()}ensureDefaultBank(e){return e.some(a=>a.id==="qb-default"||a.isDefault)?e.map(a=>a.id==="qb-default"?{...a,name:"Default Question Bank",isDefault:!0}:a):[$u,...e.filter(a=>a.id!=="qb-default")]}async syncFromBackend(){try{const e=await D.questionBanks();if(e&&Array.isArray(e.items)&&e.items.length>0){const s=e.items.map(a=>({id:a.id,name:a.name,description:a.description||"",jobId:a.jobId||null,jobTitle:a.jobTitle||null,createdAt:a.createdAt||new Date().toISOString(),badgeTone:a.badgeTone||"from-blue-600 to-indigo-600",isDefault:!!(a.isDefault||a.id==="qb-default")}));this.banks=this.ensureDefaultBank(s),this.syncedWithBackend=!0,this.persist()}}catch{}}persist(){try{localStorage.setItem(Xl,JSON.stringify(this.banks))}catch{}}getBanks(){return this.banks.length||this.init(),[...this.banks]}getBank(e){return this.banks.find(s=>s.id===e)||null}createBank(e,s,a,n){const i=`qb-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,o=["from-blue-600 to-indigo-600","from-emerald-600 to-teal-600","from-purple-600 to-violet-600","from-amber-600 to-orange-600","from-cyan-600 to-blue-600"],r=o[this.banks.length%o.length],l={id:i,name:e.trim()||`Question Bank ${this.banks.length+1}`,description:s.trim(),jobId:a||null,jobTitle:n||null,createdAt:new Date().toISOString(),badgeTone:r,isDefault:!1};return this.banks.push(l),this.persist(),D.createQuestionBank({name:l.name,description:l.description,jobId:l.jobId,jobTitle:l.jobTitle,badgeTone:l.badgeTone}).then(d=>{d!=null&&d.id&&d.id!==i&&(l.id=d.id,this.persist())}).catch(()=>{}),l}updateBank(e,s){const a=this.banks.findIndex(n=>n.id===e);if(a!==-1){const i=!!(this.banks[a].isDefault||e==="qb-default")?{...s,name:"Default Question Bank",isDefault:!0}:s;this.banks[a]={...this.banks[a],...i},this.persist(),D.updateQuestionBank(e,{name:this.banks[a].name,description:s.description,jobId:s.jobId,jobTitle:s.jobTitle}).catch(()=>{})}}deleteBank(e){const s=this.banks.find(a=>a.id===e);!s||s.isDefault||s.id==="qb-default"||(this.banks=this.banks.filter(a=>a.id!==e),this.banks.length||(this.banks=[...Zl]),this.persist(),D.deleteQuestionBank(e).catch(()=>{}))}getBankIdForQuestion(e){const s=Array.isArray(e.tags)?e.tags:[];for(const a of s)if(typeof a=="string"&&a.startsWith("bank:")){const n=a.substring(5).trim(),i=this.banks.find(o=>o.id===n||o.name.toLowerCase()===n.toLowerCase());if(i)return i.id}if(e.jobId){const a=this.banks.find(n=>n.jobId===e.jobId&&!n.isDefault&&n.id!=="qb-default");if(a)return a.id}return"qb-default"}stampQuestionBank(e,s){const a=Array.isArray(e)?e.filter(n=>typeof n=="string"&&!n.startsWith("bank:")):[];return a.push(`bank:${s}`),a}getBanksForJob(e,s){const a=new Set;for(const n of this.banks)n.jobId===e&&a.add(n.id);for(const n of s)if(n.jobId===e){const i=this.getBankIdForQuestion(n);a.add(i)}return a.size>0?this.banks.filter(n=>a.has(n.id)):this.banks.filter(n=>!n.jobId)}}const fe=new vh,ed=["mcq","msq","drag_drop","coding","sql","essay"],yh=["Quantitative Aptitude","Logical Reasoning","English","Technical"],wh=["MCQ","Theory","Coding"],Eu=t=>t.type==="essay"?"Theory":t.type==="coding"||t.type==="sql"?"Coding":"MCQ",td=["draft","open","closed"];class Sh{constructor(e){b(this,"container");b(this,"jobs",[]);b(this,"openJobId","");b(this,"openBankId","");b(this,"openSection","");b(this,"questionsByJob",{});b(this,"loadingJobId","");b(this,"pendingStatus",{});b(this,"activeJobId","");b(this,"assessment",null);b(this,"jobQuestions",[]);b(this,"categories",[]);b(this,"loading",!0);b(this,"error","");this.container=e}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{const e=await D.jobs();this.jobs=e.items||[],this.openJobId&&!this.jobs.some(s=>s.id===this.openJobId)&&(this.openJobId="",this.openSection="")}catch(e){this.error=e instanceof V?e.message:"Could not load jobs.",this.jobs=[],this.assessment=null}finally{this.loading=!1,this.paint()}}activeJob(){return this.jobs.find(e=>e.id===this.activeJobId)||null}async loadActiveExam(){const e=this.activeJob();if(!e){this.assessment=null,this.jobQuestions=[];return}const[s,a]=await Promise.all([D.assessment(e.assessmentId),D.jobQuestions(e.id)]);this.assessment=s,this.jobQuestions=a.items||[]}paint(){if(this.loading){this.container.innerHTML='<p class="text-xs text-slate-500 font-mono py-8">Loading jobs…</p>';return}if(this.error){this.container.innerHTML=`<p class="text-xs text-red-400 font-semibold py-8">${P(this.error)}</p>`;return}this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-white">Jobs</h2>
            <p class="text-xs text-slate-400 mt-0.5">All jobs are listed here. Open a job to see its sections, then open a section to see its questions.</p>
          </div>
          <button id="add-job-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">+ Create job</button>
        </div>
        ${this.jobs.length?`
          <div class="space-y-3">
            ${this.jobs.map(e=>this.jobRow(e)).join("")}
          </div>
        `:'<p class="text-xs text-slate-500">No jobs yet. Create one to start an empty exam.</p>'}
      </div>
      <div id="admin-modal-host"></div>`,this.attachEvents()}jobRow(e){const s=e.id===this.openJobId,a=this.questionsByJob[e.id]||[],n=this.loadingJobId===e.id;return`
      <div class="rounded-2xl bg-slate-900 border ${s?"border-violet-500/40":"border-slate-800"}">
        <div class="flex items-start gap-3 p-4">
          <button data-job-toggle="${P(e.id)}" class="flex-1 min-w-0 text-left">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-slate-500 text-xs">${s?"▾":"▸"}</span>
              <span class="text-sm font-bold text-white">${P(e.title)}</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${$h(e.status)}">${P(e.status)}</span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">⏱ ${e.totalDurationMinutes||60} min</span>
              ${e.scheduledDate?`<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">📅 ${P(e.scheduledDate)}</span>`:""}
              ${e.startTime?`<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">⏰ ${P(e.startTime)}</span>`:""}
            </div>
            <p class="text-xs text-slate-400 mt-1 pl-5">${e.description?P(e.description):"No description yet."}</p>
          </button>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <select data-job-status="${P(e.id)}" class="glass-input px-2.5 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
              ${td.map(i=>`<option value="${i}" ${(this.pendingStatus[e.id]||e.status)===i?"selected":""}>${i}</option>`).join("")}
            </select>
            ${this.pendingStatus[e.id]&&this.pendingStatus[e.id]!==e.status?`<button data-job-save="${P(e.id)}" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">Save</button>`:""}
            <button data-job-edit="${P(e.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-slate-700">Edit</button>
            <button data-job-del="${P(e.id)}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
          </div>
        </div>
        ${s?`
          <div class="px-4 pb-4 space-y-4">
            <!-- Exam Schedule & Overall Duration Setting Card -->
            <div class="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white uppercase tracking-wider">⏱ Exam Schedule & Overall Duration</span>
                  <span class="text-[10px] text-slate-400 font-mono">(Applies to whole test across all sections)</span>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Overall Duration (mins)</label>
                  <input type="number" min="5" max="360" id="job-dur-${P(e.id)}" value="${e.totalDurationMinutes||60}" class="glass-input w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs font-mono" />
                  <p class="text-[10px] text-slate-500 mt-0.5">Overall time candidate gets on screen</p>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Assessment Date</label>
                  <input type="date" min="${new Date().toISOString().split("T")[0]}" id="job-date-${P(e.id)}" value="${P(e.scheduledDate||"")}" class="glass-input w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs" />
                  <p class="text-[10px] text-slate-500 mt-0.5">Scheduled exam date (today or future)</p>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-300 mb-1">Test Start Time</label>
                  <input type="text" id="job-time-${P(e.id)}" placeholder="e.g. 10:00 AM" value="${P(e.startTime||"")}" class="glass-input w-full px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white text-xs" />
                  <p class="text-[10px] text-slate-500 mt-0.5">Check-in is 30 mins before this</p>
                </div>
              </div>
              <div class="flex items-center justify-between pt-1">
                <span id="job-save-feedback-${P(e.id)}" class="text-[11px] text-emerald-400 font-semibold"></span>
                <button data-job-save-schedule="${P(e.id)}" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all">
                  Save Schedule & Time
                </button>
              </div>
            </div>

            ${n?'<p class="text-xs text-slate-500 pl-5">Loading question banks…</p>':this.jobBanksView(e,a)}
          </div>
        `:""}
      </div>`}jobBanksView(e,s){const a=fe.getBanksForJob(e.id,s);return a.length?`
      <div class="space-y-2.5 pl-2">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
          📁 Assigned Question Banks (${a.length})
        </p>
        ${a.map(n=>this.bankRow(e.id,n,s)).join("")}
      </div>
    `:'<p class="text-xs text-slate-500 pl-5">No Question Banks assigned to this job yet.</p>'}bankRow(e,s,a){const n=a.filter(o=>fe.getBankIdForQuestion(o)===s.id),i=e===this.openJobId&&this.openBankId===s.id;return`
      <div class="rounded-xl border ${i?"border-blue-500/50 bg-slate-950/80 shadow-md":"border-slate-800 bg-slate-950/40"} transition-all">
        <button data-bank-toggle="${P(s.id)}" class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/30 rounded-xl transition-colors">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="text-slate-500 text-xs">${i?"▾":"▸"}</span>
            <span class="text-base">📁</span>
            <span class="text-sm font-bold text-white truncate">${P(s.name)}</span>
            <span class="text-[11px] text-slate-400 hidden sm:inline">• ${P(s.description)}</span>
          </div>
          <span class="text-xs font-mono text-slate-400 shrink-0">
            <b class="text-blue-400">${n.length}</b> questions
          </span>
        </button>
        ${i?`
          <div class="px-4 pb-4 pt-1 space-y-2 border-t border-slate-800/60 mt-1">
            <div class="text-[11px] text-slate-400 font-semibold mb-2 pl-2">
              Sub-sections inside ${P(s.name)}:
            </div>
            ${yh.map(o=>this.sectionRow(e,s.id,o,n)).join("")}
          </div>
        `:""}
      </div>`}sectionRow(e,s,a,n){const i=n.filter(r=>(r.sectionCategory||"")===a),o=e===this.openJobId&&this.openBankId===s&&this.openSection===a;return`
      <div class="rounded-xl border border-slate-800 bg-slate-900/60">
        <button data-section-toggle="${P(a)}" class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-800/20 rounded-xl">
          <span class="text-xs font-semibold text-white"><span class="text-slate-500 mr-2">${o?"▾":"▸"}</span>${P(a)}</span>
          <span class="text-[11px] font-mono text-slate-400"><b class="text-purple-400">${i.length}</b> questions</span>
        </button>
        ${o?`
          <div class="px-4 pb-3 pt-1 space-y-2.5 border-t border-slate-800/40">
            ${i.length?wh.map(r=>{const l=i.filter(d=>Eu(d)===r);return l.length?`
                <div class="space-y-1.5 pl-4">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-indigo-300">${P(r)}</p>
                  ${l.map(d=>kh(d)).join("")}
                </div>`:""}).join(""):'<p class="text-[11px] text-slate-500 pl-4 py-1">No questions in this sub-section yet. Add them in Question Bank.</p>'}
          </div>
        `:""}
      </div>`}attachEvents(){var e;(e=this.container.querySelector("#add-job-btn"))==null||e.addEventListener("click",()=>this.renderJobModal()),this.container.querySelectorAll("[data-job-toggle]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-toggle")||"";n&&this.toggleJob(n)})}),this.container.querySelectorAll("[data-bank-toggle]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-bank-toggle")||"";this.openBankId=this.openBankId===n?"":n,this.openSection="",this.paint()})}),this.container.querySelectorAll("[data-section-toggle]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-section-toggle")||"";this.openSection=this.openSection===n?"":n,this.paint()})}),this.container.querySelectorAll("[data-job-edit]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-edit")||"",i=this.jobs.find(o=>o.id===n);i&&this.renderJobModal(i)})}),this.container.querySelectorAll("[data-job-del]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-del")||"",i=this.jobs.find(o=>o.id===n);i&&confirm(`Delete “${i.title}” and its exam?`)&&this.deleteJob(i)})}),this.container.querySelectorAll("[data-job-status]").forEach(s=>{s.addEventListener("change",a=>{const n=a.currentTarget.getAttribute("data-job-status")||"",i=a.currentTarget.value,o=this.jobs.find(r=>r.id===n);o&&(i===o.status?delete this.pendingStatus[n]:this.pendingStatus[n]=i,this.paint())})}),this.container.querySelectorAll("[data-job-save]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-job-save")||"",i=this.jobs.find(r=>r.id===n),o=this.pendingStatus[n];i&&o&&this.setStatus(i,o)})}),this.container.querySelectorAll("[data-sec-edit]").forEach(s=>{s.addEventListener("click",a=>{var o;const n=a.currentTarget.getAttribute("data-sec-edit"),i=(o=this.assessment)==null?void 0:o.sections.find(r=>r.id===n);i&&this.renderSectionModal(i)})}),this.container.querySelectorAll("[data-job-save-schedule]").forEach(s=>{s.addEventListener("click",async a=>{const n=a.currentTarget.getAttribute("data-job-save-schedule")||"",i=this.container.querySelector(`#job-dur-${n}`),o=this.container.querySelector(`#job-date-${n}`),r=this.container.querySelector(`#job-time-${n}`),l=this.container.querySelector(`#job-save-feedback-${n}`),d=i&&parseInt(i.value,10)||60,c=o?o.value.trim():"",u=r?r.value.trim():"",h=new Date().toISOString().split("T")[0];if(c&&c<h){alert("Assessment date cannot be in the past. Please select today or a future date.");return}try{const p=await D.updateJob(n,{totalDurationMinutes:d,scheduledDate:c,startTime:u}),f=this.jobs.findIndex(g=>g.id===n);f>=0&&(this.jobs[f]=p),l&&(l.textContent="✓ Saved to database!",setTimeout(()=>{l&&(l.textContent="")},3e3)),this.paint()}catch(p){alert(p instanceof V?p.message:"Could not save schedule.")}})}),this.container.querySelectorAll("[data-sec-del]").forEach(s=>{s.addEventListener("click",a=>{const n=a.currentTarget.getAttribute("data-sec-del");n&&confirm("Delete this section from the exam?")&&this.deleteSection(n)})})}async toggleJob(e){if(this.openJobId===e){this.openJobId="",this.openBankId="",this.openSection="",this.paint();return}this.openJobId=e,this.openBankId="",this.openSection="",this.activeJobId=e,this.loadingJobId=e,this.paint();try{const s=await D.jobQuestions(e);this.questionsByJob[e]=s.items||[]}catch(s){this.questionsByJob[e]=[],alert(s instanceof V?s.message:"Could not load this job.")}finally{this.loadingJobId=""}this.paint()}async selectJob(e){this.activeJobId=e,this.loading=!0,this.paint();try{await this.loadActiveExam(),this.error=""}catch(s){this.error=s instanceof V?s.message:"Could not open this job.",this.assessment=null}finally{this.loading=!1,this.paint()}}async setStatus(e,s){try{const a=await D.updateJob(e.id,{status:s});this.jobs=this.jobs.map(n=>n.id===a.id?a:n),delete this.pendingStatus[e.id],this.paint()}catch(a){alert(a instanceof V?a.message:"Could not update status."),this.paint()}}async deleteJob(e){try{await D.deleteJob(e.id),this.jobs=this.jobs.filter(s=>s.id!==e.id),delete this.questionsByJob[e.id],this.openJobId===e.id&&(this.openJobId="",this.openSection=""),this.paint()}catch(s){alert(s instanceof V?s.message:"Could not delete this job.")}}renderJobModal(e){var i,o,r;const s=this.container.querySelector("#admin-modal-host");if(!s)return;const a=!!e;s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">${a?"Edit job":"Create job"}</h3>
            <button id="close-job-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="job-form" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="job-title" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Senior Software Engineer" value="${P((e==null?void 0:e.title)||"")}" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Description</label>
              <textarea id="job-desc" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="What this hire will do">${P((e==null?void 0:e.description)||"")}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Status</label>
              <select id="job-modal-status" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                ${td.map(l=>`<option value="${l}" ${((e==null?void 0:e.status)||"draft")===l?"selected":""}>${l}</option>`).join("")}
              </select>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Overall Duration</label>
                <input type="number" min="5" max="360" id="job-modal-dur" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-xs" value="${(e==null?void 0:e.totalDurationMinutes)||60}" />
                <span class="text-[10px] text-slate-500">Mins (all sections)</span>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assessment Date</label>
                <input type="date" min="${new Date().toISOString().split("T")[0]}" id="job-modal-date" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs" value="${P((e==null?void 0:e.scheduledDate)||"")}" />
                <span class="text-[10px] text-slate-500">Exam date (today/future)</span>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Start Time</label>
                <input type="text" id="job-modal-time" placeholder="e.g. 10:00 AM" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs" value="${P((e==null?void 0:e.startTime)||"")}" />
                <span class="text-[10px] text-slate-500">Exam start</span>
              </div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" id="close-job-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"Save":"Create"}</button>
            </div>
          </form>
        </div>
      </div>`;const n=()=>{s.innerHTML=""};(i=s.querySelector("#close-job-modal"))==null||i.addEventListener("click",n),(o=s.querySelector("#close-job-modal-2"))==null||o.addEventListener("click",n),(r=s.querySelector("#job-form"))==null||r.addEventListener("submit",l=>{l.preventDefault(),this.saveJob(e,s,n)})}async saveJob(e,s,a){const n=s.querySelector("#job-title").value.trim(),i=s.querySelector("#job-desc").value.trim(),o=s.querySelector("#job-modal-status").value,r=s.querySelector("#job-modal-dur"),l=s.querySelector("#job-modal-date"),d=s.querySelector("#job-modal-time"),c=r&&parseInt(r.value,10)||60,u=l?l.value.trim():"",h=d?d.value.trim():"";if(!n)return alert("Enter a job title.");const p=new Date().toISOString().split("T")[0];if(u&&u<p)return alert("Assessment date cannot be in the past. Please select today or a future date.");try{const f={title:n,description:i,status:o,totalDurationMinutes:c,scheduledDate:u,startTime:h},g=e?await D.updateJob(e.id,f):await D.createJob(f);this.activeJobId=g.id,a(),await this.load()}catch(f){alert(f instanceof V?f.message:"Could not save the job.")}}async persistSections(e){var a;if(!this.assessment)return;this.assessment=await D.updateAssessment(this.assessment.id,{sections:e});const s=this.activeJob();s&&(s.sectionCount=((a=this.assessment.sections)==null?void 0:a.length)||0),this.paint()}async deleteSection(e){if(!this.assessment)return;const s=this.assessment.sections.filter(a=>a.id!==e);try{await this.persistSections(s)}catch(a){alert(a instanceof V?a.message:"Delete failed.")}}renderSectionModal(e){var c,u,h,p,f;const s=this.container.querySelector("#admin-modal-host");if(!s||!this.assessment)return;const a=!!e,n=new Set((e==null?void 0:e.allowedTypes)||[]),i=new Set((e==null?void 0:e.allowedCategories)||[]),o=((e==null?void 0:e.questions)||[]).map(g=>g.id);s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 class="text-lg font-extrabold text-white">${a?"Modify Section":"Add Section"}</h3>
            <button id="close-sec-modal-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="sec-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Section Name</label>
              <input id="sec-name" value="${P((e==null?void 0:e.name)||"")}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Technical MCQs" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Instructions</label>
              <textarea id="sec-inst" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Complete all questions in this section.">${P((e==null?void 0:e.instructions)||"")}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Time Limit (Minutes)</label>
                <input type="number" id="sec-time" value="${(e==null?void 0:e.timeLimitMinutes)??""}" placeholder="15" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Passing Points</label>
                <input type="number" id="sec-pass" value="${(e==null?void 0:e.passingMarks)??""}" placeholder="20" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
            </div>

            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed question types</p>
              <div class="flex flex-wrap gap-2">
                ${ed.map(g=>`
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-type" value="${g}" ${n.has(g)?"checked":""} /> ${g}
                  </label>`).join("")}
              </div>
            </div>
            <div>
              <p class="font-semibold text-slate-300 mb-2">Allowed categories</p>
              <div class="flex flex-wrap gap-2">
                ${this.categories.length?this.categories.map(g=>`
                  <label class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <input type="checkbox" class="sec-cat" value="${P(g.label)}" ${i.has(g.label)?"checked":""} /> ${P(g.label)}
                  </label>`).join(""):'<p class="text-amber-300 text-[11px]">This job has no categories yet. Add them in the question bank below.</p>'}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Pick N random (blank = all)</label>
                <input type="number" id="sec-pick" value="${(e==null?void 0:e.pickCount)??""}" min="1" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. 20" />
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" id="sec-rand" ${e!=null&&e.randomizeQuestions?"checked":""} /> Randomize question order
                </label>
              </div>
            </div>

            ${a?`
              <div class="border-t border-slate-800 pt-4 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="font-semibold text-slate-300">Assign questions <span id="pool-count" class="text-slate-500 font-mono"></span></p>
                    <p class="text-[11px] text-slate-500 mt-1">Tick questions from this job or the company library. Uncheck to remove one from the section. The question stays in its bank. Type and category limits apply to this list after you save them.</p>
                  </div>
                  <input id="elig-search" placeholder="Search…" class="glass-input w-48 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div class="flex flex-wrap gap-2">
                  ${["all","job","library"].map(g=>`
                    <button type="button" data-src="${g}" class="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border ${g==="all"?"bg-violet-600 text-white border-violet-500":"bg-slate-900 text-slate-400 border-slate-700"}">${g==="all"?"All":g==="job"?"This job":"Library"}</button>
                  `).join("")}
                </div>
                <div id="elig-list" class="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-800 p-2 bg-slate-950/50"></div>
                <input type="hidden" id="sec-pool-ids" value="${P(o.join(","))}" />
                <div class="rounded-xl border border-slate-800 p-3 space-y-2 bg-slate-950/40">
                  <p class="font-semibold text-slate-300">Create on this job and attach</p>
                  ${this.categories.length?`
                    <div class="grid grid-cols-2 gap-2">
                      <input id="new-q-title" placeholder="Question title" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <select id="new-q-type" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${ed.map(g=>`<option value="${g}">${g}</option>`).join("")}
                      </select>
                      <select id="new-q-cat" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white">
                        ${this.categories.map(g=>`<option value="${P(g.label)}">${P(g.label)}</option>`).join("")}
                      </select>
                      <input id="new-q-content" placeholder="Question text" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <div id="new-q-options" class="grid grid-cols-2 gap-2">
                      <input id="new-q-opt-a" placeholder="Option A" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                      <input id="new-q-opt-b" placeholder="Option B (correct)" class="glass-input px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" />
                    </div>
                    <button type="button" id="create-attach-btn" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold">Create and attach</button>
                  `:'<p class="text-amber-300 text-[11px]">Add a category in this job’s question bank before creating a question here.</p>'}
                </div>
              </div>
            `:'<p class="text-[11px] text-slate-500">Save the section first, then assign questions to it.</p>'}

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-sec-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"SAVE":"ADD"}</button>
            </div>
          </form>
        </div>
      </div>`;let r=!1;const l=()=>{s.innerHTML=""},d=()=>{s.innerHTML="",r&&this.load()};if((c=s.querySelector("#close-sec-modal-btn"))==null||c.addEventListener("click",d),(u=s.querySelector("#close-sec-modal-btn-2"))==null||u.addEventListener("click",d),(h=s.querySelector("#sec-form"))==null||h.addEventListener("submit",g=>{g.preventDefault(),this.saveSection(e,s,l)}),a&&e){this.refreshEligible(e,s,"all"),(p=s.querySelector("#elig-search"))==null||p.addEventListener("input",()=>{var j;const v=((j=s.querySelector(".pool-src.bg-violet-600"))==null?void 0:j.getAttribute("data-src"))||"all";this.refreshEligible(e,s,v)}),s.querySelectorAll(".pool-src").forEach(v=>{v.addEventListener("click",()=>{s.querySelectorAll(".pool-src").forEach(j=>{j.className="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-slate-900 text-slate-400 border-slate-700"}),v.className="pool-src px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-violet-600 text-white border-violet-500",this.refreshEligible(e,s,v.getAttribute("data-src")||"all")})});const g=s.querySelector("#new-q-type"),m=s.querySelector("#new-q-options"),w=()=>{const v=(g==null?void 0:g.value)||"";m==null||m.classList.toggle("hidden",!(v==="mcq"||v==="msq"))};g==null||g.addEventListener("change",w),w(),(f=s.querySelector("#create-attach-btn"))==null||f.addEventListener("click",()=>{this.createAndAttach(e,s).then(v=>{v&&(r=!0)})})}}async refreshEligible(e,s,a){var l;if(!this.assessment)return;const n=((l=s.querySelector("#elig-search"))==null?void 0:l.value)||"",i=s.querySelector("#elig-list"),o=s.querySelector("#sec-pool-ids");if(!i||!o)return;const r=new Set(o.value.split(",").filter(Boolean));try{const{items:d}=await D.eligibleQuestions(this.assessment.id,e.id,n||void 0),c=d.filter(h=>a==="job"?!!h.jobId:a==="library"?!h.jobId:!0);i.innerHTML=c.map(h=>`
        <label class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-900 cursor-pointer">
          <input type="checkbox" class="pool-q" value="${P(h.id)}" ${r.has(h.id)?"checked":""} />
          <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${Au(h.type)}">${P(h.type)}</span>
          <span class="text-slate-200 truncate">${P(h.title)}</span>
          <span class="ml-auto shrink-0 text-[10px] font-bold ${h.jobId?"text-indigo-300":"text-slate-500"}">${h.jobId?"This job":"Library"}</span>
        </label>`).join("")||'<p class="text-slate-500 px-2 py-2">Nothing to assign. Add questions in this job’s bank or the company library.</p>';const u=()=>{var v;const h=new Set(Array.from(i.querySelectorAll(".pool-q")).map(j=>j.value)),p=new Set(Array.from(i.querySelectorAll(".pool-q:checked")).map(j=>j.value));h.forEach(j=>{p.has(j)?r.add(j):r.delete(j)}),o.value=Array.from(r).join(",");const f=s.querySelector("#pool-count"),g=(v=s.querySelector("#sec-pick"))==null?void 0:v.value.trim(),m=g?parseInt(g,10):r.size,w=m>0?Math.min(m,r.size):r.size;f&&(f.textContent=`(${r.size} assigned, serving ${w})`)};i.querySelectorAll(".pool-q").forEach(h=>h.addEventListener("change",u)),u()}catch(d){i.innerHTML=`<p class="text-red-400 px-2">${P(d instanceof V?d.message:"Failed to load")}</p>`}}async createAndAttach(e,s){var d;const a=this.activeJob();if(!a||!this.assessment)return;const n=s.querySelector("#new-q-title").value.trim(),i=s.querySelector("#new-q-content").value.trim(),o=s.querySelector("#new-q-type").value,r=s.querySelector("#new-q-cat").value;if(!n)return alert("Enter a question title.");const l={type:o,title:n,content:i||n,sectionCategory:r,category:r,difficulty:"medium",points:10,status:"published"};if(o==="mcq"||o==="msq"){const c=s.querySelector("#new-q-opt-a").value.trim(),u=s.querySelector("#new-q-opt-b").value.trim();if(!c||!u)return alert("Enter two options. Option B is the correct one.");l.selectionMode=o==="msq"?"multi":"single",l.options=[{id:"a",text:c},{id:"b",text:u}],l.correctAnswers=o==="msq"?["a","b"]:["b"]}try{const c=await D.createJobQuestion(a.id,l),u=s.querySelector("#sec-pool-ids"),h=new Set((u.value||"").split(",").filter(Boolean));h.add(c.id),u.value=Array.from(h).join(","),await D.attachSectionQuestions(this.assessment.id,e.id,[c.id]),s.querySelector("#new-q-title").value="",s.querySelector("#new-q-content").value="";const p=((d=s.querySelector(".pool-src.bg-violet-600"))==null?void 0:d.getAttribute("data-src"))||"all";return await this.refreshEligible(e,s,p),!0}catch(c){return alert(c instanceof V?c.message:"Could not create the question."),!1}}async saveSection(e,s,a){var p;if(!this.assessment)return;const n=s.querySelector("#sec-name").value.trim(),i=s.querySelector("#sec-inst").value,o=parseInt(s.querySelector("#sec-time").value,10)||15,r=parseInt(s.querySelector("#sec-pass").value,10)||20,l=Array.from(s.querySelectorAll(".sec-type:checked")).map(f=>f.value),d=Array.from(s.querySelectorAll(".sec-cat:checked")).map(f=>f.value),c=s.querySelector("#sec-pick").value.trim(),u=c?parseInt(c,10):null,h=s.querySelector("#sec-rand").checked;try{if(e){const f=(((p=s.querySelector("#sec-pool-ids"))==null?void 0:p.value)||"").split(",").filter(Boolean);await D.updateSection(this.assessment.id,e.id,{name:n,instructions:i,timeLimitMinutes:o,passingMarks:r,allowedTypes:l,allowedCategories:d,pickCount:u,randomizeQuestions:h,questionIds:f}),await this.load()}else{const f=[...this.assessment.sections||[]];f.push({id:`sec-${Date.now()}`,name:n,description:n,instructions:i,timeLimitMinutes:o,passingMarks:r,isMandatory:!0,questions:[],allowedTypes:l,allowedCategories:d,pickCount:u,randomizeQuestions:h}),await this.persistSections(f),await this.load()}a()}catch(f){alert(f instanceof V?f.message:"Save failed.")}}}const kh=t=>`
  <div class="flex items-center gap-2 text-xs">
    <span class="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase ${Au(t.type)}">${P(Eu(t))}</span>
    <span class="text-slate-200 truncate">${P(t.title)}</span>
    <span class="ml-auto text-slate-500 shrink-0">${P(t.difficulty)} · ${t.points} pts</span>
  </div>`,P=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Au=t=>t==="coding"?"bg-blue-500/20 text-blue-300":t==="sql"?"bg-purple-500/20 text-purple-300":t==="essay"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/20 text-emerald-300",$h=t=>t==="open"?"bg-emerald-500/15 text-emerald-300 border-emerald-500/30":t==="closed"?"bg-amber-500/15 text-amber-300 border-amber-500/30":"bg-slate-800 text-slate-300 border-slate-700";class sd{constructor(e,s,a=""){b(this,"host");b(this,"assessmentId");b(this,"jobTitle");b(this,"batch",null);b(this,"forceResend",!1);b(this,"pollTimer",null);b(this,"busy",!1);b(this,"error","");this.host=e,this.assessmentId=s,this.jobTitle=a}open(){this.batch=null,this.error="",this.forceResend=!1,this.paint()}destroy(){this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=null,this.host.innerHTML=""}paint(){const e=this.batch,s=e&&["queued","processing"].includes(e.status);this.host.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-white">Bulk Invite</h3>
              <p class="text-xs text-slate-400 mt-0.5">Upload .xlsx / .xls / .csv — Name + Email required${this.jobTitle?` · ${ns(this.jobTitle)}`:""}</p>
            </div>
            <button id="bulk-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>

          ${e?`
            <div class="flex flex-wrap gap-2 text-[11px] font-bold">
              <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Valid ${e.validRows}</span>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">File dupes ${e.duplicateInFile}</span>
              <span class="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-300 border border-orange-500/20">DB dupes ${e.duplicateInDb}</span>
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${e.totalRows}</span>
              ${e.sent!=null?`<span class="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20">Sent ${e.sent}</span>`:""}
              ${e.failed!=null?`<span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${e.failed}</span>`:""}
              <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 uppercase">${ns(e.status)}</span>
            </div>

            ${e.status==="preview"?`
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input id="bulk-force" type="checkbox" ${this.forceResend?"checked":""} class="rounded border-slate-600" />
                Resend to candidates who already have an active invite
              </label>
            `:""}

            ${s||e.status==="completed"?`
              <div class="space-y-2">
                ${gi("Sent",e.sent||0,e.totalRows,"bg-blue-500")}
                ${gi("Failed",e.failed||0,e.totalRows,"bg-red-500")}
                ${gi("Skipped",e.skipped||0,e.totalRows,"bg-amber-500")}
              </div>
            `:""}

            <div class="overflow-x-auto rounded-xl border border-slate-800 max-h-64">
              <table class="w-full text-[11px]">
                <thead class="bg-slate-900 text-slate-400 sticky top-0">
                  <tr>
                    <th class="text-left px-3 py-2">#</th>
                    <th class="text-left px-3 py-2">Name</th>
                    <th class="text-left px-3 py-2">Email</th>
                    <th class="text-left px-3 py-2">Status</th>
                    <th class="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.rows.map(a=>`
                    <tr class="border-t border-slate-800/80">
                      <td class="px-3 py-1.5 text-slate-500 font-mono">${a.rowNumber}</td>
                      <td class="px-3 py-1.5 text-white">${ns(a.name)}</td>
                      <td class="px-3 py-1.5 text-slate-300">${ns(a.email)}</td>
                      <td class="px-3 py-1.5"><span class="px-1.5 py-0.5 rounded ${Ah(a.deliveryStatus)}">${ns(a.deliveryStatus)}</span></td>
                      <td class="px-3 py-1.5 text-red-400">${ns((a.validationErrors||[]).join("; ")||a.dedupeReason||a.errorMessage||"")}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>
          `:`
            <label id="bulk-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
              <span class="text-3xl">📤</span>
              <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
              <span class="text-[11px] text-slate-500">Columns: Name, Email, Phone, Organisation, Role, Source. Role is the open job. Source is Campus Hire, Regular, or Referral.</span>
              <input id="bulk-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" />
            </label>
          `}

          ${this.error?`<p class="text-xs text-red-400 font-semibold">${ns(this.error)}</p>`:""}

          <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button type="button" id="bulk-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">
              Download sample template
            </button>
            <div class="flex gap-3">
              <button id="bulk-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
              ${(e==null?void 0:e.status)==="preview"?`
                <button id="bulk-confirm" ${this.busy?"disabled":""} class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs">
                  ${this.busy?"Sending…":"Confirm & Dispatch"}
                </button>
              `:""}
              ${e&&(e.failed||0)>0&&e.status==="completed"?`
                <button id="bulk-retry" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">Retry Failed</button>
              `:""}
            </div>
          </div>
        </div>
      </div>`,this.bind()}bind(){var n,i,o,r,l,d;const e=()=>this.destroy();(n=this.host.querySelector("#bulk-close"))==null||n.addEventListener("click",e),(i=this.host.querySelector("#bulk-close-2"))==null||i.addEventListener("click",e),(o=this.host.querySelector("#bulk-sample"))==null||o.addEventListener("click",()=>Eh());const s=this.host.querySelector("#bulk-file"),a=this.host.querySelector("#bulk-drop");s==null||s.addEventListener("change",()=>{var u;const c=(u=s.files)==null?void 0:u[0];c&&this.preview(c)}),a==null||a.addEventListener("dragover",c=>{c.preventDefault()}),a==null||a.addEventListener("drop",c=>{var h,p;c.preventDefault();const u=(p=(h=c.dataTransfer)==null?void 0:h.files)==null?void 0:p[0];u&&this.preview(u)}),(r=this.host.querySelector("#bulk-force"))==null||r.addEventListener("change",c=>{this.forceResend=c.target.checked}),(l=this.host.querySelector("#bulk-confirm"))==null||l.addEventListener("click",()=>void this.confirm()),(d=this.host.querySelector("#bulk-retry"))==null||d.addEventListener("click",()=>void this.retry())}async preview(e){this.error="",this.busy=!0,this.paint();try{this.batch=await D.bulkPreview(this.assessmentId,e)}catch(s){this.error=s instanceof V?s.message:"Upload failed."}finally{this.busy=!1,this.paint()}}async confirm(){if(this.batch){this.busy=!0,this.error="",this.paint();try{this.batch=await D.bulkConfirm(this.batch.batchId,{forceResend:this.forceResend,expiresInHours:48}),this.startPoll()}catch(e){this.error=e instanceof V?e.message:"Confirm failed."}finally{this.busy=!1,this.paint()}}}async retry(){if(this.batch)try{this.batch=await D.bulkRetryFailed(this.batch.batchId),this.startPoll(),this.paint()}catch(e){this.error=e instanceof V?e.message:"Retry failed.",this.paint()}}startPoll(){this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=window.setInterval(async()=>{if(this.batch)try{this.batch=await D.bulkStatus(this.batch.batchId),this.paint(),(this.batch.status==="completed"||this.batch.status==="failed")&&(this.pollTimer&&window.clearInterval(this.pollTimer),this.pollTimer=null)}catch{}},2e3)}}const Eh=()=>{const t=["Name,Email,Phone,Organisation,Role,Source","Jane Doe,jane.doe@example.com,+1-555-0100,State University,DevOps Engineer,Campus Hire","Alex Chen,alex.chen@example.com,+1-555-0101,Tech Corp,Senior Software Engineer,Referral","Priya Shah,priya.shah@example.com,+1-555-0102,City College,DevOps Engineer,Regular"].join(`
`),e=new Blob([t],{type:"text/csv;charset=utf-8"}),s=URL.createObjectURL(e),a=document.createElement("a");a.href=s,a.download="bulk_invite_sample.csv",a.click(),URL.revokeObjectURL(s)},ns=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Ah=t=>t==="SENT"?"bg-blue-500/20 text-blue-300":t==="FAILED"?"bg-red-500/20 text-red-300":t==="DUPLICATE_SKIPPED"?"bg-amber-500/20 text-amber-300":t==="COMPLETED"||t==="STARTED"?"bg-emerald-500/20 text-emerald-300":"bg-slate-800 text-slate-400",gi=(t,e,s,a)=>{const n=s?Math.round(e/s*100):0;return`
    <div class="flex items-center gap-3 text-[11px]">
      <span class="w-14 text-slate-400 font-bold">${t}</span>
      <div class="flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
        <div class="h-full ${a}" style="width:${n}%"></div>
      </div>
      <span class="w-10 text-right font-mono text-slate-300">${e}</span>
    </div>`},Th={Applied:"Applied",Screened:"Screened","Assessment Sent":"Invited",Completed:"Submitted","Under Review":"In review",Selected:"Selected",Rejected:"Rejected"},Ch=t=>Th[t]||t,Q=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Ja=(t,e,s,a="")=>`
  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col justify-between">
    <span class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">${t}</span>
    <div class="text-2xl font-extrabold font-mono ${s} my-1">${e}</div>
    ${a?`<span class="text-[10px] text-slate-500 font-mono">${a}</span>`:""}
  </div>`;class Lh{constructor(e,s){b(this,"container");b(this,"candidateId");b(this,"row",null);b(this,"error","");b(this,"loading",!0);b(this,"savingDecision",!1);this.container=e,this.candidateId=s}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{this.row=await D.candidate(this.candidateId)}catch(e){this.error=e instanceof Error?e.message:"Could not load candidate.",this.row=null}finally{this.loading=!1,this.paint()}}paint(){var i,o,r,l,d,c,u;if(this.loading){this.container.innerHTML=`
        <div class="max-w-5xl mx-auto py-24 text-center space-y-3">
          <div class="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs text-slate-400 font-mono">Loading candidate profile & assessment paper…</p>
        </div>`;return}if(this.error||!this.row){this.container.innerHTML=`
        <div class="max-w-5xl mx-auto py-16 px-4 space-y-4 text-center">
          <p class="text-sm text-red-400 font-semibold">${this.error||"Candidate not found."}</p>
          <button id="cd-back" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs">← Back to pipeline</button>
        </div>`,(i=this.container.querySelector("#cd-back"))==null||i.addEventListener("click",()=>ye.navigate("/recruiter/candidate-assessments"));return}const e=this.row,s=e.result,a=e.status==="Completed"||!!s;this.container.innerHTML=`
      <div class="max-w-5xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <div class="flex items-center justify-between">
          <button id="cd-back" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            ← Back to pipeline
          </button>
          <span class="text-xs text-slate-500 font-mono">ID: ${Q(e.id)}</span>
        </div>

        <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 bg-slate-950/80">
          <!-- Candidate Header Profile -->
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div class="flex items-start gap-3.5">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                ${e.name.split(" ").map(h=>h[0]).join("").slice(0,2).toUpperCase()||"CA"}
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <h1 class="text-2xl font-extrabold text-white tracking-tight">${Q(e.name)}</h1>
                  <span class="px-2.5 py-0.5 text-xs font-bold rounded-lg border ${e.status==="Selected"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":e.status==="Rejected"?"bg-rose-500/10 text-rose-400 border-rose-500/20":e.status==="Under Review"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-slate-800 text-slate-300 border-slate-700"}">
                    ${Q(Ch(e.status))}
                  </span>
                  ${e.roleTitle?`
                    <span class="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      🎯 ${Q(e.roleTitle)}
                    </span>`:""}
                </div>
                <p class="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
                  <span>✉️ ${Q(e.email)}</span>
                  <span>·</span>
                  <span>📞 ${Q(e.phone||"No phone")}</span>
                  <span>·</span>
                  <span>💼 ${e.experienceYears}y experience</span>
                </p>
                ${e.organization||e.source?`
                  <p class="text-[11px] text-slate-500">${[e.organization,e.source].filter(Boolean).map(h=>Q(h)).join(" · ")}</p>
                `:""}
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${(e.skills||[]).map(h=>`
                    <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-900 text-slate-300 border border-slate-800 rounded-md">
                      ${Q(h)}
                    </span>`).join("")}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              ${s?`
                <button id="cd-csv" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all">
                  📥 Export scorecard
                </button>
              `:""}
              ${s?"":`
                <button id="cd-reinvite" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30">
                  Resend invite
                </button>
              `}
            </div>
          </div>

          <!-- Score Overview Section -->
          ${s?this.scoreHtml(s):`
            <div class="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
              <span class="text-2xl">⏳</span>
              <p class="text-sm font-semibold text-white">Assessment not submitted yet</p>
              <p class="text-xs text-slate-500">Candidate invite was sent on ${Q(e.invitedAt||"—")}. Awaiting exam completion.</p>
            </div>
          `}

          <!-- Decision Action Section -->
          ${a?this.decisionHtml(s):""}

          <!-- Detailed Candidate Question & Answer Review -->
          ${this.paperHtml(e)}
        </div>
      </div>`,(o=this.container.querySelector("#cd-back"))==null||o.addEventListener("click",()=>ye.navigate("/recruiter/candidate-assessments")),(r=this.container.querySelector("#cd-csv"))==null||r.addEventListener("click",()=>this.exportCsv()),(l=this.container.querySelector("#cd-reinvite"))==null||l.addEventListener("click",()=>{this.reinvite()});const n=this.container.querySelector("#recruiter-notes");(d=this.container.querySelector("#decide-select"))==null||d.addEventListener("click",()=>{this.decide("Selected",(n==null?void 0:n.value)||"")}),(c=this.container.querySelector("#decide-review"))==null||c.addEventListener("click",()=>{this.decide("Under Review",(n==null?void 0:n.value)||"")}),(u=this.container.querySelector("#decide-reject"))==null||u.addEventListener("click",()=>{this.decide("Rejected",(n==null?void 0:n.value)||"")})}scoreHtml(e){const s=e.passStatus==="Pass"||e.percentage>=70,a=Object.entries(e.sectionScores||{}).filter(([n])=>!n.startsWith("_"));return`
      <!-- Metric Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${Ja("Total Score",`${e.totalScore} / ${e.maxScore}`,"text-indigo-400",`${e.percentage}% marks scored`)}
        ${Ja("Performance",`${e.percentage}%`,s?"text-emerald-400":"text-rose-400",s?"✓ Passed minimum cutoff":"✗ Below passing threshold")}
        ${Ja("AI Integrity Score",`${e.aiConfidenceScore}%`,"text-purple-300","Automated proctoring confidence")}
        ${Ja("Flagged Violations",String(e.totalViolations),e.totalViolations>0?"text-amber-400":"text-emerald-400",e.totalViolations>0?"Proctoring warnings noted":"Clean proctoring session")}
      </div>

      <!-- Section Scores Table -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <span>📊 Section-Wise Marks & Percentage Breakdown</span>
          </h3>
          <span class="text-[11px] font-mono text-slate-500">${a.length} sections graded</span>
        </div>
        <div class="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-slate-900/90 text-slate-400 text-[10px] font-semibold tracking-wide uppercase">
              <tr>
                <th class="p-3 border-b border-slate-800">Section Name</th>
                <th class="p-3 border-b border-slate-800">Score / Max</th>
                <th class="p-3 border-b border-slate-800">Percentage</th>
                <th class="p-3 border-b border-slate-800 w-48">Progress</th>
                <th class="p-3 border-b border-slate-800">Status</th>
              </tr>
            </thead>
            <tbody class="font-mono divide-y divide-slate-800/60">
              ${a.length===0?`
                <tr><td colspan="5" class="p-4 text-center text-slate-500">No section score records available.</td></tr>
              `:a.map(([n,i])=>{const o=Number(i.percentage??(i.maxScore?(i.score/i.maxScore*100).toFixed(1):0)),r=o>=70;return`
                  <tr class="hover:bg-slate-900/40 transition-colors">
                    <td class="p-3 font-sans font-medium text-slate-200">
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full ${r?"bg-emerald-500":"bg-amber-500"}"></span>
                        <span>${Q(n)}</span>
                      </div>
                    </td>
                    <td class="p-3 text-slate-300 font-bold">${i.score} / ${i.maxScore}</td>
                    <td class="p-3 font-bold ${r?"text-emerald-400":"text-amber-400"}">${o}%</td>
                    <td class="p-3">
                      <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div class="h-full rounded-full transition-all ${r?"bg-emerald-500":"bg-amber-500"}" style="width: ${Math.min(100,Math.max(0,o))}%"></div>
                      </div>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/20":"bg-amber-500/10 text-amber-400 border border-amber-500/20"}">
                        ${r?"PASS":"NEEDS REVIEW"}
                      </span>
                    </td>
                  </tr>`}).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Proctoring Events Log -->
      ${(e.proctoringLogs||[]).length>0?`
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-slate-300 tracking-wide uppercase flex items-center gap-2">
            <span>🛡️ Proctoring Verification Logs</span>
          </h3>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            ${(e.proctoringLogs||[]).map(n=>`
              <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded ${n.severity==="high"?"bg-rose-500/20 text-rose-300 border border-rose-500/30":"bg-amber-500/20 text-amber-300 border border-amber-500/30"}">${Q(n.severity)}</span>
                  <span class="font-bold text-white">${Q(n.type)}</span>
                  <span class="text-slate-400 truncate">${Q(n.description)}</span>
                </div>
                <span class="font-mono text-slate-500 text-[10px] shrink-0">${Q(n.timestamp)}</span>
              </div>`).join("")}
          </div>
        </div>
      `:""}`}decisionHtml(e){var n;const s=(e==null?void 0:e.recruiterDecision)||((n=this.row)==null?void 0:n.status)||"Under Review",a=(e==null?void 0:e.recruiterNotes)||"";return`
      <!-- Recruiter Decision Box -->
      <div class="pt-5 border-t border-slate-800 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span>⚖️ Recruiter Hiring Decision</span>
          </h3>
          <span class="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-lg border ${s==="Selected"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/30":s==="Rejected"?"bg-rose-500/10 text-rose-400 border-rose-500/30":"bg-amber-500/10 text-amber-400 border-amber-500/30"}">
            Current: ${Q(s)}
          </span>
        </div>

        <textarea id="recruiter-notes" placeholder="Add recruiter feedback or notes for interviewers…" class="w-full p-3.5 glass-input rounded-2xl text-xs text-white border border-slate-700 bg-slate-950 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-600" rows="3">${Q(a)}</textarea>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2.5">
            <button id="decide-select" class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/30">
              ✓ Select Candidate
            </button>
            <button id="decide-review" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all">
              ⏸ Hold / Interview
            </button>
            <button id="decide-reject" class="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30">
              ✗ Reject
            </button>
          </div>
          <span class="text-[11px] text-slate-500 font-mono">Updates candidate status immediately</span>
        </div>
      </div>`}paperHtml(e){const s=e.paper||[];if(!s.length)return`
        <div class="pt-6 border-t border-slate-800 text-center py-8 text-slate-500 text-xs">
          No question paper record available for this candidate.
        </div>`;const a="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return`
      <div class="space-y-6 pt-6 border-t border-slate-800">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>📝 Detailed Question & Candidate Response Review</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Review every question shown to this candidate. Identified answer keys and candidate selections are labeled below.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            ${s.reduce((n,i)=>{var o;return n+(((o=i.questions)==null?void 0:o.length)||0)},0)} Questions
          </span>
        </div>

        ${s.map(n=>`
          <div class="space-y-3.5 bg-slate-950/60 p-5 rounded-3xl border border-slate-800/80">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white">SECTION</span>
                <h4 class="text-sm font-bold text-white">${Q(n.name)}</h4>
              </div>
              <span class="text-[11px] font-mono text-slate-400">${n.questions.length} questions</span>
            </div>

            <div class="space-y-4">
              ${n.questions.map(i=>{const o=i.candidateAnswer,r=i.type==="mcq"||i.type==="msq",l=o&&typeof o=="object"&&(o.code||o.sql),d=l&&(o.code||o.sql)||"",c=l?o.language||i.language||"code":"";let u=!1,h=!1;if(r){const p=i.options.filter(m=>m.correct),f=new Set(p.map(m=>String(m.id||"")));let g=[];if(Array.isArray(o)?g=o.map(m=>String(m)):o!=null&&typeof o=="string"?g=[o]:o!=null&&typeof o=="number"&&(g=[String(o)]),h=g.length>0,i.type==="mcq"){const m=g[0],w=i.options.find(v=>v.text.trim()===String(o||"").trim());u=f.has(m)||!!w&&w.correct}else if(i.type==="msq"){const m=new Set(g);u=m.size===f.size&&[...m].every(w=>f.has(w))}}else o&&(h=!0);return`
                  <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 transition-all hover:border-slate-700">
                    <!-- Question Header & Badges -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          Q${i.number}
                        </span>
                        <h5 class="text-xs font-bold text-white">${Q(i.title)}</h5>
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          ${Q(i.type)}
                        </span>
                        ${i.difficulty?`
                          <span class="px-2 py-0.5 rounded text-[10px] font-mono capitalize ${i.difficulty==="easy"?"text-emerald-400 bg-emerald-500/10":i.difficulty==="hard"?"text-rose-400 bg-rose-500/10":"text-amber-400 bg-amber-500/10"}">
                            ${Q(i.difficulty)}
                          </span>`:""}
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="text-[11px] font-mono text-slate-400 font-bold">${i.points||10} pts</span>
                        ${r?h?u?`
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              ✓ Correct (+${i.points||10} pts)
                            </span>
                          `:`
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              ✗ Incorrect (0 pts)
                            </span>
                          `:`
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              ○ Not Attempted
                            </span>
                          `:""}
                      </div>
                    </div>

                    <!-- Question Prompt / Content -->
                    ${i.content&&i.content!==i.title?`
                      <p class="text-xs text-slate-300 leading-relaxed font-sans">${Q(i.content)}</p>
                    `:""}

                    <!-- MCQ / MSQ Options with Crystal Clear Identifiers -->
                    ${i.options&&i.options.length?`
                      <div class="space-y-2 pt-1">
                        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Options & Answer Comparison:</p>
                        <div class="grid grid-cols-1 gap-2">
                          ${i.options.map((p,f)=>{const g=String(p.id||""),m=!!p.correct;let w=!1;return Array.isArray(o)?w=o.map(v=>String(v)).includes(g):o!=null&&(w=String(o)===g||String(o).trim()===p.text.trim()),`
                              <div class="p-3 rounded-xl border flex items-start justify-between gap-3 transition-all ${m&&w?"bg-emerald-950/40 border-emerald-500/70 text-emerald-100 shadow-sm":w&&!m?"bg-rose-950/40 border-rose-500/70 text-rose-100 shadow-sm":m&&!w?"bg-emerald-950/20 border-emerald-500/40 text-emerald-300":"bg-slate-950/40 border-slate-800 text-slate-400"}">
                                <div class="flex items-start gap-2.5 min-w-0">
                                  <span class="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 font-mono ${m&&w?"bg-emerald-600 text-white":w&&!m?"bg-rose-600 text-white":m?"bg-emerald-800/80 text-emerald-200":"bg-slate-800 text-slate-400"}">
                                    ${a[f]||f+1}
                                  </span>
                                  <span class="text-xs font-sans leading-relaxed pt-0.5">${Q(p.text)}</span>
                                </div>

                                <div class="flex items-center gap-1.5 shrink-0">
                                  ${w&&m?`
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                                      ✓ Candidate Picked
                                    </span>
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                                      ✓ Correct Key
                                    </span>
                                  `:w&&!m?`
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40">
                                      ✗ Candidate Picked (Wrong)
                                    </span>
                                  `:m&&!w?`
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      ✓ Correct Key
                                    </span>
                                  `:""}
                                </div>
                              </div>`}).join("")}
                        </div>
                      </div>
                    `:""}

                    <!-- Coding / SQL Solution Box -->
                    ${l?`
                      <div class="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div class="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span class="font-bold text-white flex items-center gap-1.5">
                            💻 Submitted Candidate Code
                          </span>
                          <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase text-[10px]">
                            ${Q(c)}
                          </span>
                        </div>
                        <pre class="font-mono text-xs text-emerald-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto leading-relaxed border border-slate-800 max-h-64">${Q(d)}</pre>
                      </div>
                    `:""}

                    <!-- Non-Code Candidate Answer (Text / Essay) -->
                    ${!r&&!l&&o?`
                      <div class="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Candidate Written Response:</span>
                        <p class="text-xs text-indigo-200 font-sans leading-relaxed whitespace-pre-wrap">${Q(typeof o=="string"?o:JSON.stringify(o))}</p>
                      </div>
                    `:""}

                    <!-- Recruiter Explanation Key -->
                    ${i.explanation?`
                      <div class="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                        <span class="text-indigo-400 font-bold shrink-0">💡 Note for Recruiter:</span>
                        <span class="font-sans leading-relaxed">${Q(i.explanation)}</span>
                      </div>
                    `:""}
                  </div>`}).join("")}
            </div>
          </div>
        `).join("")}
      </div>`}exportCsv(){if(!this.row)return;const e=this.row.result,s=["Candidate ID","Name","Email","Phone","Job Role","Status","Total Score","Max Score","Percentage","Pass Status","Violations","Recruiter Notes"],a=[this.row.id,this.row.name,this.row.email,this.row.phone||"",this.row.roleTitle||"",this.row.status,(e==null?void 0:e.totalScore)??this.row.totalScore??"N/A",(e==null?void 0:e.maxScore)??this.row.maxScore??"N/A",(e==null?void 0:e.percentage)!=null?`${e.percentage}%`:this.row.percentage!=null?`${this.row.percentage}%`:"N/A",(e==null?void 0:e.passStatus)??this.row.passStatus??"N/A",(e==null?void 0:e.totalViolations)??this.row.violations??0,(e==null?void 0:e.recruiterNotes)||""];ku.downloadCsv(`${this.row.name.replace(/\s+/g,"_")}_Scorecard.csv`,s,[a])}async decide(e,s){if(!this.savingDecision){this.savingDecision=!0;try{this.row=await D.setDecision(this.candidateId,e,s),this.paint()}catch(a){alert(a instanceof Error?a.message:"Could not save decision.")}finally{this.savingDecision=!1}}}async reinvite(){if(!this.row||!confirm(`Send ${this.row.name} a new exam link and a new passcode? The previous link will stop working.`))return;const e=this.container.querySelector("#cd-reinvite");e&&(e.disabled=!0,e.textContent="Sending…");try{const s=await L.createInvite({name:this.row.name,email:this.row.email,phone:this.row.phone,assessmentId:this.row.assessmentId||"assess-101",expiresInHours:48,candidateId:this.row.id}),a=Date.now()+2e4;let n="PENDING",i="";for(;Date.now()<a;){await new Promise(o=>window.setTimeout(o,1e3));try{const o=await L.inviteDelivery(s.inviteId);if(n=o.deliveryStatus,i=o.message,n==="SENT"||n==="FAILED"||n==="STARTED")break}catch{}}alert(n==="SENT"||n==="STARTED"?`A new exam link and passcode were emailed to ${s.otpDestination}. Earlier links for this assessment no longer work.`:n==="FAILED"?i||"The new invitation was saved, but the email was not delivered. Check the email settings and try again.":`The new invitation is saved for ${s.otpDestination}. The email is still going out — check the inbox, then Spam.`),await this.load()}catch(s){alert(s instanceof Error?s.message:"Invite failed."),e&&(e.disabled=!1,e.textContent="Resend invite")}}}const vi=["Quantitative Aptitude","Logical Reasoning","English","Technical"],Zi=[{label:"MCQ",type:"mcq"},{label:"Theory",type:"essay"},{label:"Coding",type:"coding"}],Ih=[{label:"MCQ (Multiple Choice)",type:"mcq"},{label:"Theory / Essay",type:"essay"}],Mh=t=>{var e;return((e=Zi.find(s=>s.type===t))==null?void 0:e.label)||(t==="msq"?"MCQ":t==="sql"?"Coding":t)};class _h{constructor(e,s){b(this,"container");b(this,"jobId");b(this,"jobTitle");b(this,"questions",[]);b(this,"categories",[]);b(this,"jobs",[]);b(this,"jobRoles",[]);b(this,"filterCategory","");b(this,"filterType","");b(this,"filterJobId","");b(this,"loading",!0);b(this,"error","");b(this,"starterDraft",{});b(this,"starterLang","python");b(this,"activeFolderId",null);this.container=e,this.jobId=(s==null?void 0:s.jobId)||"",this.jobTitle=(s==null?void 0:s.jobTitle)||""}render(){this.load(),this.paint()}async load(){this.loading=!0,this.error="",this.paint();try{const[e,s,a]=await Promise.all([this.jobId?D.jobQuestions(this.jobId,{category:this.filterCategory||void 0,type:this.filterType||void 0}):D.questions({category:this.filterCategory||void 0,type:this.filterType||void 0,scope:"all"}),D.questionCategories(),D.jobs()]);this.questions=this.filterJobId&&!this.jobId?e.items.filter(n=>n.jobId===this.filterJobId):e.items,this.categories=s.items,this.jobs=a.items||[]}catch(e){this.error=e instanceof V?e.message:"Could not load questions.",this.questions=[]}finally{this.loading=!1,this.paint()}}paint(){if(this.loading){this.container.innerHTML='<p class="text-xs text-slate-500 font-mono py-8">Loading question banks…</p>';return}const e=fe.getBanks();if(this.activeFolderId){const s=fe.getBank(this.activeFolderId)||e[0];this.paintFolderView(s);return}this.paintAllBanksView(e)}paintAllBanksView(e){const s=this.filterJobId?this.jobTitleName(this.filterJobId):"",a=this.filterJobId?e.filter(n=>n.jobId===this.filterJobId?!0:n.jobId&&n.jobId!==this.filterJobId?!1:this.questions.filter(o=>fe.getBankIdForQuestion(o)===n.id).length>0?!0:n.isDefault||n.id==="qb-default"?!e.some(r=>r.jobId===this.filterJobId):!1):e;this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2.5">
              <span class="text-xl">📁</span>
              <h2 class="text-lg font-bold text-white">Question Banks</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/20">${a.length} ${a.length===1?"Bank":"Banks"}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Organize and author question banks into folders. Open a Question Bank to create questions, coding problems, or bulk import.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button id="create-bank-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-1.5 transition-all">
              <span>+</span> Create Question Bank
            </button>
          </div>
        </div>

        ${this.jobs.length?`
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-xs text-slate-400 font-semibold mr-1">Filter by Job:</span>
            <button data-job="" class="filter-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId?"bg-slate-900 text-slate-400 border-slate-700":"bg-violet-600 text-white border-violet-500"}">All jobs</button>
            ${this.jobs.map(n=>`
              <button data-job="${k(n.id)}" class="filter-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId===n.id?"bg-violet-600 text-white border-violet-500":"bg-slate-900 text-slate-400 border-slate-700"}">${k(n.title)}</button>
            `).join("")}
          </div>
        `:""}

        ${this.error?`<p class="text-xs text-red-400 font-semibold">${k(this.error)}</p>`:""}

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${a.length?a.map(n=>{const i=this.questions.filter(c=>fe.getBankIdForQuestion(c)===n.id),o=i.filter(c=>c.type==="mcq"||c.type==="msq").length,r=i.filter(c=>c.type==="coding"||c.type==="sql").length,l=i.filter(c=>c.type==="essay").length,d=n.jobTitle||(n.jobId?this.jobTitleName(n.jobId):null);return`
              <div class="group relative rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${n.badgeTone||"from-blue-600 to-indigo-600"} flex items-center justify-center text-2xl shadow-md shadow-blue-900/30">
                      📁
                    </div>
                    ${n.isDefault||n.id==="qb-default"?`
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <span>🔒</span> Default Bank
                      </span>
                    `:`
                      <div class="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button data-bank-edit="${k(n.id)}" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs" title="Edit Bank">✏️</button>
                        <button data-bank-del="${k(n.id)}" class="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs" title="Delete Bank">🗑️</button>
                      </div>
                    `}
                  </div>

                  <div>
                    <h3 class="text-base font-bold text-white group-hover:text-blue-400 transition-colors">${k(n.name)}</h3>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">${k(n.description||"Custom Question Bank folder for assessments.")}</p>
                  </div>

                  <div class="pt-1">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      <span>💼</span>
                      <span>${k(d||"All Jobs / General")}</span>
                    </span>
                  </div>

                  <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span class="text-base font-extrabold font-mono text-white">${i.length}</span>
                      <span class="text-[11px] text-slate-400 ml-1">Questions</span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-mono space-x-1">
                      <span class="text-blue-400 font-semibold">${o} MCQ</span> •
                      <span class="text-emerald-400 font-semibold">${r} Coding</span> •
                      <span class="text-purple-400 font-semibold">${l} Theory</span>
                    </div>
                  </div>
                </div>

                <button data-open-bank="${k(n.id)}" class="w-full mt-4 py-2.5 px-4 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 hover:border-transparent transition-all flex items-center justify-center gap-2">
                  <span>Open Question Bank</span>
                  <span>➔</span>
                </button>
              </div>
            `}).join(""):`
            <div class="col-span-full py-12 px-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-2xl">
                📁
              </div>
              <h4 class="text-sm font-bold text-slate-200">No Question Banks found for ${k(s||"this job")}</h4>
              <p class="text-xs text-slate-400 max-w-md mx-auto">
                No question bank has been assigned to this job or contains questions for it yet.
              </p>
              <button id="create-bank-empty-btn" class="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all">
                + Create Question Bank for ${k(s||"this job")}
              </button>
            </div>
          `}
        </div>
      </div>
      <div id="admin-modal-host"></div>
    `,this.attachAllBanksEvents()}paintFolderView(e){const s=this.questions.filter(n=>fe.getBankIdForQuestion(n)===e.id&&(!this.filterJobId||n.jobId===this.filterJobId)),a=e.jobTitle||(e.jobId?this.jobTitleName(e.jobId):null);this.container.innerHTML=`
      <div class="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <!-- Breadcrumb & Top Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
          <div class="flex items-center gap-2 text-slate-400">
            <button id="qb-back-btn" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 border border-slate-700 transition-all">
              <span>←</span> All Question Banks
            </button>
            <span class="text-slate-600">/</span>
            <span class="text-white font-bold flex items-center gap-1">
              <span>📁</span> ${k(e.name)}
              ${e.isDefault||e.id==="qb-default"?'<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 ml-2">Permanent Default</span>':""}
            </span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">${s.length} Questions inside</span>
        </div>

        <!-- Folder Header & Action Buttons -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${e.badgeTone||"from-blue-600 to-indigo-600"} flex items-center justify-center text-xl shadow">
                📁
              </div>
              <div>
                <h2 class="text-lg font-bold text-white">${k(e.name)}</h2>
                <p class="text-xs text-slate-400">${k(e.description||"Custom Question Bank folder.")}</p>
              </div>
            </div>
            <div class="pt-1 pl-13">
              <span class="text-[11px] font-semibold text-indigo-400">
                Assigned Job: <strong class="text-slate-200">${k(a||"All Jobs / General")}</strong>
              </span>
            </div>
          </div>

          <!-- Buttons inside folder per user request: Create Question, Create Coding Question, Bulk Upload (No Export) -->
          <div class="flex flex-wrap items-center gap-2">
            <button id="bulk-q-btn" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-slate-700">
              Bulk upload
            </button>
            <button id="create-q-btn" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md">
              + Create Question
            </button>
            <button id="create-coding-q-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all">
              <span>⚡</span> + Create Coding Question
            </button>
          </div>
        </div>

        <!-- Job Filters inside Folder -->
        ${this.jobs.length?`
          <div class="flex flex-wrap gap-2 items-center pb-1">
            <span class="text-xs text-slate-400 font-semibold mr-1">Filter by Job:</span>
            <button data-folder-job="" class="filter-folder-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId?"bg-slate-900 text-slate-400 border-slate-700":"bg-violet-600 text-white border-violet-500"}">All jobs</button>
            ${this.jobs.map(n=>`
              <button data-folder-job="${k(n.id)}" class="filter-folder-job px-3 py-1 rounded-lg text-[11px] font-bold border ${this.filterJobId===n.id?"bg-violet-600 text-white border-violet-500":"bg-slate-900 text-slate-400 border-slate-700"}">${k(n.title)}</button>
            `).join("")}
          </div>
        `:""}

        <!-- Filter Chips inside Folder -->
        <div class="flex flex-wrap gap-2 items-center">
          <button data-section="" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterCategory?"bg-slate-900 text-slate-400 border-slate-700":"bg-blue-600 text-white border-blue-500"}">All sections</button>
          ${vi.map(n=>`
            <button data-section="${k(n)}" class="filter-section px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterCategory===n?"bg-blue-600 text-white border-blue-500":"bg-slate-900 text-slate-400 border-slate-700"}">${k(n)}</button>
          `).join("")}
        </div>
        <div class="flex flex-wrap gap-2">
          <button data-type="" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterType?"bg-slate-900 text-slate-400 border-slate-700":"bg-indigo-600 text-white border-indigo-500"}">All categories</button>
          ${Zi.map(n=>`
            <button data-type="${n.type}" class="filter-type px-3 py-1.5 rounded-lg text-[11px] font-bold border ${this.filterType===n.type?"bg-indigo-600 text-white border-indigo-500":"bg-slate-900 text-slate-400 border-slate-700"}">${n.label}</button>
          `).join("")}
        </div>

        ${this.error?`<p class="text-xs text-red-400 font-semibold">${k(this.error)}</p>`:""}

        <!-- Questions List inside Folder -->
        <div class="space-y-3">
          ${s.map(n=>`
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-colors">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${jh(n.type)}">${k(n.type)}</span>
                  <h4 class="text-xs font-bold text-white truncate">${k(n.title)}</h4>
                </div>
                <p class="text-xs text-slate-300 mt-1.5 line-clamp-2">${k(n.content||n.title)}</p>
                <p class="text-[11px] text-slate-400 mt-1">${k(n.sectionCategory||"No section")} • ${k(Mh(n.type))} • ${k(this.jobName(n)||"Not assigned")} • ${k(n.difficulty)} • ${n.points} pts</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button data-q-edit="${n.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-xs border border-slate-700">Edit</button>
                <button data-q-del="${n.id}" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 font-bold text-xs border border-slate-700">Delete</button>
              </div>
            </div>`).join("")||`
            <div class="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <p class="text-sm font-bold text-slate-300">No questions in this Question Bank yet</p>
              <p class="text-xs text-slate-500">Use the buttons above to create multiple choice, theory, coding challenges, or bulk upload.</p>
            </div>
          `}
        </div>
      </div>
      <div id="admin-modal-host"></div>
    `,this.attachFolderEvents(e)}attachAllBanksEvents(){var e,s;(e=this.container.querySelector("#create-bank-btn"))==null||e.addEventListener("click",()=>{this.renderBankModal()}),(s=this.container.querySelector("#create-bank-empty-btn"))==null||s.addEventListener("click",()=>{this.renderBankModal()}),this.container.querySelectorAll("[data-open-bank]").forEach(a=>{a.addEventListener("click",n=>{const i=n.currentTarget.getAttribute("data-open-bank");i&&(this.activeFolderId=i,this.paint())})}),this.container.querySelectorAll("[data-bank-edit]").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation();const i=n.currentTarget.getAttribute("data-bank-edit"),o=i?fe.getBank(i):null;o&&this.renderBankModal(o)})}),this.container.querySelectorAll("[data-bank-del]").forEach(a=>{a.addEventListener("click",n=>{n.stopPropagation();const i=n.currentTarget.getAttribute("data-bank-del"),o=i?fe.getBank(i):null;if(o!=null&&o.isDefault||i==="qb-default"){alert("Default Question Bank cannot be deleted.");return}i&&confirm("Delete this Question Bank folder? Questions will be reassigned to the default bank.")&&(fe.deleteBank(i),this.paint())})}),this.container.querySelectorAll(".filter-job").forEach(a=>{a.addEventListener("click",n=>{this.filterJobId=n.currentTarget.getAttribute("data-job")||"",this.load()})})}attachFolderEvents(e){var s,a,n,i;(s=this.container.querySelector("#qb-back-btn"))==null||s.addEventListener("click",()=>{this.activeFolderId=null,this.paint()}),(a=this.container.querySelector("#create-q-btn"))==null||a.addEventListener("click",()=>this.renderQuestionModal(void 0,e.id)),(n=this.container.querySelector("#create-coding-q-btn"))==null||n.addEventListener("click",()=>this.renderCodingQuestionModal(void 0,e.id)),(i=this.container.querySelector("#bulk-q-btn"))==null||i.addEventListener("click",()=>this.renderBulkUploadModal(e.id)),this.container.querySelectorAll(".filter-folder-job").forEach(o=>{o.addEventListener("click",r=>{this.filterJobId=r.currentTarget.getAttribute("data-folder-job")||"",this.load()})}),this.container.querySelectorAll(".filter-section").forEach(o=>{o.addEventListener("click",r=>{this.filterCategory=r.currentTarget.getAttribute("data-section")||"",this.load()})}),this.container.querySelectorAll(".filter-type").forEach(o=>{o.addEventListener("click",r=>{this.filterType=r.currentTarget.getAttribute("data-type")||"",this.load()})}),this.container.querySelectorAll("[data-q-edit]").forEach(o=>{o.addEventListener("click",r=>{const l=r.currentTarget.getAttribute("data-q-edit"),d=this.questions.find(c=>c.id===l);d&&(d.type==="coding"||d.type==="sql"?this.renderCodingQuestionModal(d,e.id):this.renderQuestionModal(d,e.id))})}),this.container.querySelectorAll("[data-q-del]").forEach(o=>{o.addEventListener("click",r=>{const l=r.currentTarget.getAttribute("data-q-del");l&&confirm("Delete this question?")&&this.remove(l)})})}jobName(e){var s;return((s=this.jobs.find(a=>a.id===e.jobId))==null?void 0:s.title)||e.jobRole||""}jobTitleName(e){var s;return((s=this.jobs.find(a=>a.id===e))==null?void 0:s.title)||""}renderBankModal(e){var i,o,r;if(e&&(e.isDefault||e.id==="qb-default")){alert("The Default Question Bank is permanent and cannot be modified or renamed.");return}const s=this.container.querySelector("#admin-modal-host");if(!s)return;const a=!!e;s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">${a?"Edit Question Bank":"Create Question Bank Folder"}</h3>
            <button id="close-bank-modal" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <form id="bank-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Question Bank Name</label>
              <input id="bank-name" required value="${k((e==null?void 0:e.name)||"")}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-bold" placeholder="e.g. Question Bank 1, Core Technical Bank" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Description</label>
              <textarea id="bank-desc" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Description of topics covered in this question bank">${k((e==null?void 0:e.description)||"")}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Assign to Job (Optional)</label>
              <select id="bank-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                <option value="">— All Jobs / General Library —</option>
                ${this.jobs.map(l=>{const d=e?e.jobId===l.id:this.filterJobId===l.id;return`<option value="${k(l.id)}" ${d?"selected":""}>${k(l.title)}</option>`}).join("")}
              </select>
            </div>
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button type="button" id="close-bank-modal-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${a?"Save Changes":"Create Bank"}</button>
            </div>
          </form>
        </div>
      </div>
    `;const n=()=>{s.innerHTML=""};(i=s.querySelector("#close-bank-modal"))==null||i.addEventListener("click",n),(o=s.querySelector("#close-bank-modal-2"))==null||o.addEventListener("click",n),(r=s.querySelector("#bank-form"))==null||r.addEventListener("submit",l=>{l.preventDefault();const d=s.querySelector("#bank-name").value.trim(),c=s.querySelector("#bank-desc").value.trim(),u=s.querySelector("#bank-job").value||null,h=u?this.jobTitleName(u):null;if(d){if(a&&e)fe.updateBank(e.id,{name:d,description:c,jobId:u,jobTitle:h});else{const p=fe.createBank(d,c,u,h);this.activeFolderId=p.id}n(),this.paint()}})}async remove(e){try{await D.deleteQuestion(e),await this.load()}catch(s){alert(s instanceof V?s.message:"Delete failed.")}}renderQuestionModal(e,s){var u,h,p,f,g,m,w;const a=this.container.querySelector("#admin-modal-host");if(!a)return;const n=!!e,i=(u=e==null?void 0:e.options)!=null&&u.length?e.options:[{id:"opt-1",text:""},{id:"opt-2",text:""}],o=(e==null?void 0:e.sectionCategory)||"Quantitative Aptitude",r=fe.getBanks(),l=e?fe.getBankIdForQuestion(e):s||((h=r[0])==null?void 0:h.id)||"qb-1";a.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-lg font-extrabold text-white">${n?"Modify Question":"Create Question"}</h3>
              <p class="text-xs text-slate-400">Author objective Multiple Choice or descriptive Theory questions.</p>
            </div>
            <button id="close-q-modal-btn" class="text-slate-400 hover:text-white font-bold text-base hover:bg-slate-800 p-2 rounded-xl">✕</button>
          </div>
          <form id="q-form" class="space-y-4 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Title</label>
              <input id="q-title" value="${k((e==null?void 0:e.title)||"")}" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="e.g. Memory allocation in Python, Time Complexity of Merge Sort" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Stem / Content</label>
              <textarea id="q-content" rows="3" required class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Question statement seen by candidates">${k((e==null?void 0:e.content)||"")}</textarea>
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Explanation</label>
              <textarea id="q-explanation" rows="2" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Why this answer is correct. Candidates do not see this during the exam.">${k((e==null?void 0:e.explanation)||"")}</textarea>
            </div>

            <!-- Question Bank Folder Selection -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">📁 Question Bank Folder</label>
              <select id="q-bank" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium">
                ${r.map(v=>`<option value="${k(v.id)}" ${v.id===l?"selected":""}>${k(v.name)}</option>`).join("")}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Section</label>
                <select id="q-cat" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${vi.map(v=>`<option value="${k(v)}" ${v===o?"selected":""}>${k(v)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Category</label>
                <select id="q-type" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${Ih.map(v=>`<option value="${v.type}" ${(e==null?void 0:e.type)===v.type||!e&&v.type==="mcq"?"selected":""}>${v.label}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assign to job</label>
                <select id="q-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="">Not assigned</option>
                  ${this.jobs.map(v=>{const j=v.status==="closed",he=(e==null?void 0:e.jobId)===v.id;return j&&!he?"":`<option value="${k(v.id)}" ${he?"selected":""} ${j?"disabled":""}>${k(v.title)}${j?" (closed)":""}</option>`}).join("")}
                </select>
              </div>
            </div>
            <p class="text-[11px] text-slate-500">Assigning a job shows this question in the Assessment Builder under the section and category you chose.</p>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty</label>
                <select id="q-diff" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${["easy","medium","hard"].map(v=>`<option value="${v}" ${(e==null?void 0:e.difficulty)===v?"selected":""}>${v}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Points</label>
                <input type="number" id="q-points" value="${(e==null?void 0:e.points)||10}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Stem format</label>
                <select id="q-stem" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  <option value="plain" ${(e==null?void 0:e.stemFormat)!=="markdown"?"selected":""}>plain</option>
                  <option value="markdown" ${(e==null?void 0:e.stemFormat)==="markdown"?"selected":""}>markdown</option>
                </select>
              </div>
            </div>

            <div id="panel-mcq" class="space-y-3 hidden">
              <div class="flex items-center justify-between">
                <p class="font-semibold text-slate-300" id="opts-label">Options</p>
                <button type="button" id="add-opt" class="text-blue-400 font-bold">+ Add</button>
              </div>
              <p id="drag-hint" class="text-[11px] text-slate-500 hidden">List items in the <b>correct order</b>. Candidates will reorder them via drag-and-drop (order is never shown to them).</p>
              <div id="opts-list" class="space-y-2">
                ${i.map((v,j)=>ad(v.id,v.text,((e==null?void 0:e.correctAnswers)||[]).includes(v.id),j,(e==null?void 0:e.type)==="drag_drop")).join("")}
              </div>
            </div>

            <div id="panel-essay" class="space-y-3 hidden">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Min words</label>
                  <input type="number" id="q-minw" value="${(e==null?void 0:e.essayMinWords)||50}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-300 mb-1">Max words</label>
                  <input type="number" id="q-maxw" value="${(e==null?void 0:e.essayMaxWords)||500}" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" />
                </div>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Rubric</label>
                <textarea id="q-rubric" rows="3" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" placeholder="Evaluation criteria for automated AI scoring">${k((e==null?void 0:e.rubric)||"")}</textarea>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-q-modal-btn-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold">${n?"SAVE":"CREATE"}</button>
            </div>
          </form>
        </div>
      </div>`;const d=()=>{a.innerHTML=""};(p=a.querySelector("#close-q-modal-btn"))==null||p.addEventListener("click",d),(f=a.querySelector("#close-q-modal-btn-2"))==null||f.addEventListener("click",d);const c=()=>{var ht,Rt,Ot;const v=a.querySelector("#q-type").value,j=v==="mcq"||v==="msq"||v==="drag_drop";(ht=a.querySelector("#panel-mcq"))==null||ht.classList.toggle("hidden",!j),(Rt=a.querySelector("#panel-essay"))==null||Rt.classList.toggle("hidden",v!=="essay"),(Ot=a.querySelector("#drag-hint"))==null||Ot.classList.toggle("hidden",v!=="drag_drop");const he=a.querySelector("#opts-label");he&&(he.textContent=v==="drag_drop"?"Items (correct order top → bottom)":"Options"),a.querySelectorAll(".opt-correct").forEach(ts=>{ts.style.display=v==="drag_drop"?"none":""})};(g=a.querySelector("#q-type"))==null||g.addEventListener("change",c),c(),(m=a.querySelector("#add-opt"))==null||m.addEventListener("click",()=>{const v=a.querySelector("#opts-list");if(!v)return;const j=`opt-${Date.now()}`;v.insertAdjacentHTML("beforeend",ad(j,"",!1,v.children.length))}),(w=a.querySelector("#q-form"))==null||w.addEventListener("submit",v=>{v.preventDefault(),this.saveQuestion(e,a,d)})}renderCodingQuestionModal(e,s){var c,u,h,p,f,g;const a=this.container.querySelector("#admin-modal-host");if(!a)return;const n=!!e,i=(c=e==null?void 0:e.testCases)!=null&&c.length?e.testCases:[{id:"tc-1",input:`2 7 11 15
9`,inputs:["2 7 11 15","9"],expectedOutput:"0 1",isHidden:!1,weight:1},{id:"tc-2",input:`3 2 4
6`,inputs:["3 2 4","6"],expectedOutput:"1 2",isHidden:!0,weight:1}],o=(e==null?void 0:e.sectionCategory)||"Technical",r=fe.getBanks(),l=e?fe.getBankIdForQuestion(e):s||((u=r[0])==null?void 0:u.id)||"qb-1";a.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-800 p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">⚡ LeetCode Problem Studio</span>
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400">Competitive Coding</span>
              </div>
              <h3 class="text-xl font-extrabold text-white">${n?"Modify Coding Challenge":"Create Coding Challenge"}</h3>
              <p class="text-xs text-slate-400">Design problem statement, runtime constraints, boilerplate starter stubs, and automated test cases.</p>
            </div>
            <button id="close-code-modal-btn" class="p-2 text-slate-400 hover:text-white font-bold text-base hover:bg-slate-800 rounded-xl transition-all">✕</button>
          </div>

          <form id="code-q-form" class="space-y-5 text-xs">
            <div class="space-y-1.5">
              <label class="block font-semibold text-slate-200">Problem Title <span class="text-rose-400">*</span></label>
              <input id="code-q-title" value="${k((e==null?void 0:e.title)||"")}" required placeholder="e.g. Two Sum, Reverse Linked List, Valid Palindrome, LRU Cache" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium" />
            </div>

            <!-- Folder selection row -->
            <div>
              <label class="block font-semibold text-slate-300 mb-1">📁 Question Bank Folder</label>
              <select id="code-q-bank" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium">
                ${r.map(m=>`<option value="${k(m.id)}" ${m.id===l?"selected":""}>${k(m.name)}</option>`).join("")}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Section</label>
                <select id="code-q-cat" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  ${vi.map(m=>`<option value="${k(m)}" ${m===o?"selected":""}>${k(m)}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Assign to Job</label>
                <select id="code-q-job" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  <option value="">Not assigned</option>
                  ${this.jobs.map(m=>{const w=m.status==="closed",v=(e==null?void 0:e.jobId)===m.id;return w&&!v?"":`<option value="${k(m.id)}" ${v?"selected":""} ${w?"disabled":""}>${k(m.title)}${w?" (closed)":""}</option>`}).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Difficulty</label>
                <select id="code-q-diff" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white">
                  ${["easy","medium","hard"].map(m=>`<option value="${m}" ${(e==null?void 0:e.difficulty)===m?"selected":""}>${m.toUpperCase()}</option>`).join("")}
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-300 mb-1">Score / Points</label>
                <input type="number" id="code-q-points" value="${(e==null?void 0:e.points)||20}" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white" />
              </div>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block font-semibold text-slate-200">Problem Description (Markdown Supported) <span class="text-rose-400">*</span></label>
                <span class="text-[11px] text-slate-400">Include clear problem background and example inputs/outputs</span>
              </div>
              <textarea id="code-q-content" rows="6" required class="glass-input w-full p-3.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono leading-relaxed" placeholder="Given an array of integers nums and an integer target...">${k((e==null?void 0:e.content)||"")}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-300">Constraints</label>
                <textarea id="code-q-constraints" rows="3" class="glass-input w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-[11px]" placeholder="1 <= nums.length <= 10^5">${k((e==null?void 0:e.constraints)||"")}</textarea>
              </div>
              <div class="space-y-1.5">
                <label class="block font-semibold text-slate-300">Input / Output Format</label>
                <textarea id="code-q-io" rows="3" class="glass-input w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono text-[11px]" placeholder="Input: First line contains array elements.">${k((e==null?void 0:e.ioFormat)||"")}</textarea>
              </div>
            </div>

            <!-- Starter Boilerplate Code -->
            <div id="starter-block" class="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-bold text-slate-200">Starter Boilerplate Code</p>
                  <p class="text-[11px] text-slate-400">Configure language signature stubs (Python, JS, C++, Java, etc.). Candidate writes inside the middle editable space.</p>
                </div>
              </div>
              <div id="starter-tabs" class="flex flex-wrap gap-1.5 pt-1"></div>
              <div class="space-y-2">
                <label class="block font-semibold text-slate-400 text-[11px]">Function Header / Code Before (Locked)</label>
                <textarea id="starter-before" rows="4" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-300 font-mono text-[11px]" spellcheck="false"></textarea>
                <div class="py-1 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-mono text-center">
                  ⌨️ Candidate Editor Space (Candidate writes implementation here)
                </div>
                <label class="block font-semibold text-slate-400 text-[11px]">Runner Harness / Code After (Locked)</label>
                <textarea id="starter-after" rows="3" class="glass-input w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-emerald-300 font-mono text-[11px]" spellcheck="false"></textarea>
              </div>
            </div>

            <!-- Test Cases Suite -->
            <div class="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-slate-200">Test Cases Suite</p>
                    <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold">Automated Evaluator</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Include public test cases (matching Examples) and hidden test cases for final grading.</p>
                </div>
                <button type="button" id="add-code-tc" class="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 transition-all">+ Add Test Case</button>
              </div>
              <div id="tc-list" class="space-y-3 pt-1">
                ${i.map((m,w)=>nd(m,w)).join("")}
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button type="button" id="close-code-modal-btn-2" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold">Cancel</button>
              <button type="submit" class="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30">${n?"SAVE CHALLENGE":"CREATE CHALLENGE"}</button>
            </div>
          </form>
        </div>
      </div>`;const d=()=>{a.innerHTML=""};(h=a.querySelector("#close-code-modal-btn"))==null||h.addEventListener("click",d),(p=a.querySelector("#close-code-modal-btn-2"))==null||p.addEventListener("click",d),this.mountStarterEditor(a,e),(f=a.querySelector("#add-code-tc"))==null||f.addEventListener("click",()=>{const m=a.querySelector("#tc-list");if(!m)return;const w=`tc-${Date.now()}`;m.insertAdjacentHTML("beforeend",nd({id:w,input:"",inputs:[""],expectedOutput:"",isHidden:!1,weight:1},m.children.length)),this.attachTestCasesInputHandlers(a)}),this.attachTestCasesInputHandlers(a),(g=a.querySelector("#code-q-form"))==null||g.addEventListener("submit",m=>{m.preventDefault(),this.saveCodingQuestion(e,a,d)})}attachTestCasesInputHandlers(e){e.querySelectorAll(".add-tc-input").forEach(s=>{s.dataset.bound||(s.dataset.bound="true",s.addEventListener("click",()=>{var i;const a=(i=s.closest("[data-tc-row]"))==null?void 0:i.querySelector(".tc-inputs");if(!a)return;const n=a.querySelectorAll(".tc-input-slot").length;a.insertAdjacentHTML("beforeend",Tu("",n)),this.reindexTcInputs(a)}))}),e.querySelectorAll(".remove-tc-input").forEach(s=>{s.dataset.bound||(s.dataset.bound="true",s.addEventListener("click",()=>{const a=s.closest(".tc-input-slot"),n=a==null?void 0:a.parentElement;a==null||a.remove(),n&&this.reindexTcInputs(n)}))})}reindexTcInputs(e){e.querySelectorAll(".tc-input-slot").forEach((s,a)=>{const n=s.querySelector(".tc-input-label");n&&(n.textContent=`Input ${a+1}`)})}flushStarterFields(e){const s=e.querySelector("#starter-before"),a=e.querySelector("#starter-after");!s||!a||(this.starterDraft[this.starterLang]={before:s.value,after:a.value})}mountStarterEditor(e,s){this.starterDraft={},rn.forEach(l=>{var u;const d=(u=s==null?void 0:s.sampleCode)==null?void 0:u[l.id],c=Ei(l.id);d&&typeof d=="object"&&((d.before||"").trim()||(d.after||"").trim())?this.starterDraft[l.id]={before:d.before||"",after:d.after||""}:typeof d=="string"&&d.trim()?this.starterDraft[l.id]={before:d,after:""}:this.starterDraft[l.id]=c}),this.starterLang=s!=null&&s.language&&this.starterDraft[s.language]?s.language:"python";const a=e.querySelector("#starter-tabs"),n=e.querySelector("#starter-before"),i=e.querySelector("#starter-after"),o=()=>{a&&(a.innerHTML=rn.map(l=>`
        <button type="button" data-starter-lang="${l.id}" class="px-2 py-1 rounded-lg text-[10px] font-bold border ${this.starterLang===l.id?"bg-blue-600 text-white border-blue-500":"bg-slate-900 text-slate-400 border-slate-700"}">${k(l.label.split(" ")[0])}</button>
      `).join(""),a.querySelectorAll("[data-starter-lang]").forEach(l=>{l.addEventListener("click",()=>{this.flushStarterFields(e),this.starterLang=l.getAttribute("data-starter-lang")||"python";const d=this.starterDraft[this.starterLang]||Ei(this.starterLang);n&&(n.value=d.before),i&&(i.value=d.after),o()})}))},r=this.starterDraft[this.starterLang]||{before:"",after:""};n&&(n.value=r.before),i&&(i.value=r.after),o()}async saveQuestion(e,s,a){var c,u,h,p,f;const n=s.querySelector("#q-type").value,i=s.querySelector("#q-cat").value,o=((c=s.querySelector("#q-job"))==null?void 0:c.value)||this.jobId||"",r=((u=s.querySelector("#q-bank"))==null?void 0:u.value)||this.activeFolderId||"qb-1",l=fe.stampQuestionBank(e==null?void 0:e.tags,r),d={type:n,title:s.querySelector("#q-title").value.trim(),content:s.querySelector("#q-content").value.trim(),difficulty:s.querySelector("#q-diff").value,points:parseInt(s.querySelector("#q-points").value,10)||10,sectionCategory:i,category:((h=Zi.find(g=>g.type===n))==null?void 0:h.label)||"MCQ",jobId:o,jobRole:((p=this.jobs.find(g=>g.id===o))==null?void 0:p.title)||null,stemFormat:s.querySelector("#q-stem").value,explanation:((f=s.querySelector("#q-explanation"))==null?void 0:f.value)||"",tags:l,status:"published"};if(n==="mcq"||n==="msq"||n==="drag_drop"){d.selectionMode=n==="msq"?"multi":"single";const g=[],m=[];s.querySelectorAll("[data-opt-row]").forEach(w=>{var ht;const v=w.getAttribute("data-opt-row")||"",j=w.querySelector(".opt-text").value.trim(),he=(ht=w.querySelector(".opt-correct"))==null?void 0:ht.checked;v&&j&&(g.push({id:v,text:j}),(n==="drag_drop"||he)&&m.push(v))}),d.options=g,d.correctAnswers=m}n==="essay"&&(d.essayMinWords=parseInt(s.querySelector("#q-minw").value,10)||50,d.essayMaxWords=parseInt(s.querySelector("#q-maxw").value,10)||500,d.rubric=s.querySelector("#q-rubric").value.trim());try{e?await D.updateQuestion(e.id,d):await D.createQuestion(d),a(),await this.load()}catch(g){alert(g instanceof V?g.message:"Save failed.")}}async saveCodingQuestion(e,s,a){var u,h,p,f,g;const n=s.querySelector("#code-q-cat").value,i=((u=s.querySelector("#code-q-job"))==null?void 0:u.value)||this.jobId||"",o=((h=s.querySelector("#code-q-bank"))==null?void 0:h.value)||this.activeFolderId||"qb-1";this.flushStarterFields(s);const r={};Object.entries(this.starterDraft).forEach(([m,w])=>{((w.before||"").trim()||(w.after||"").trim())&&(r[m]=w)});const l=[];s.querySelectorAll("[data-tc-row]").forEach(m=>{var Rt,Ot,ts;const w=m.getAttribute("data-tc-row")||"",v=Array.from(m.querySelectorAll(".tc-in")).map(Cu=>Cu.value.replace(/\r\n/g,`
`)),j=(((Rt=m.querySelector(".tc-out"))==null?void 0:Rt.value)||"").replace(/\r\n/g,`
`),he=((Ot=m.querySelector(".tc-hidden"))==null?void 0:Ot.checked)||!1,ht=parseInt((ts=m.querySelector(".tc-weight"))==null?void 0:ts.value,10)||1;(j||v.some(Boolean))&&l.push({id:w,input:v.join(`
`),inputs:v,expectedOutput:j,isHidden:he,weight:ht})});const d=fe.stampQuestionBank(e==null?void 0:e.tags,o),c={type:"coding",title:s.querySelector("#code-q-title").value.trim(),content:s.querySelector("#code-q-content").value.trim(),difficulty:s.querySelector("#code-q-diff").value,points:parseInt(s.querySelector("#code-q-points").value,10)||20,sectionCategory:n,category:"Coding",jobId:i,jobRole:((p=this.jobs.find(m=>m.id===i))==null?void 0:p.title)||null,constraints:((f=s.querySelector("#code-q-constraints"))==null?void 0:f.value)||"",ioFormat:((g=s.querySelector("#code-q-io"))==null?void 0:g.value)||"",sampleCode:r,language:this.starterLang,testCases:l,tags:d,status:"published"};try{e?await D.updateQuestion(e.id,c):await D.createQuestion(c),a(),await this.load()}catch(m){alert(m instanceof V?m.message:"Save failed.")}}renderBulkUploadModal(e){const s=this.container.querySelector("#admin-modal-host");if(!s)return;let a=null,n="",i=!1;const o=()=>{var p,f,g;s.innerHTML=`
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-lg rounded-3xl border border-slate-800 p-6 space-y-5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 class="text-base font-extrabold text-white">Bulk upload questions</h3>
                <p class="text-xs text-slate-400">Upload CSV / XLSX to add questions to this Question Bank.</p>
              </div>
              <button id="bulk-q-close" class="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            ${a?`
              <div class="flex flex-wrap gap-2 text-[11px] font-bold">
                <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Created ${a.created}</span>
                <span class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 border border-red-500/20">Failed ${a.failed}</span>
                <span class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">Total ${a.totalRows}</span>
              </div>
              ${a.errors.length?`
                <div class="max-h-40 overflow-y-auto rounded-xl border border-slate-800 text-[11px]">
                  ${a.errors.map(m=>`
                    <div class="px-3 py-2 border-b border-slate-800/80">
                      <span class="text-slate-500 font-mono">Row ${m.rowNumber}</span>
                      <span class="text-white ml-2">${k(m.title||"(untitled)")}</span>
                      <p class="text-red-400 mt-0.5">${k((m.errors||[]).join("; "))}</p>
                    </div>`).join("")}
                </div>
              `:'<p class="text-xs text-emerald-300">All rows imported successfully into Question Bank.</p>'}
            `:`
              <div>
                <label class="block font-semibold text-slate-300 mb-1 text-xs">Assign imported questions to a job</label>
                <select id="bulk-q-role" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs">
                  <option value="">— Not assigned —</option>
                  ${this.jobs.filter(m=>m.status!=="closed").map(m=>`<option value="${k(m.id)}">${k(m.title)}</option>`).join("")}
                </select>
                <p class="text-[11px] text-slate-500 mt-1">Closed jobs are not listed. A Job column in the file overrides this for that row.</p>
              </div>
              <label id="bulk-q-drop" class="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 cursor-pointer hover:border-blue-500/50 transition-colors">
                <span class="text-3xl">📤</span>
                <span class="text-sm font-bold text-white">Drop spreadsheet here or click to browse</span>
                <span class="text-[11px] text-slate-500">Columns: Question, Section, Category, Content, Difficulty, Points, Options, CorrectAnswer, Job</span>
                <input id="bulk-q-file" type="file" accept=".csv,.xlsx,.xls" class="hidden" ${i?"disabled":""} />
              </label>
              ${i?'<p class="text-xs text-blue-300 font-mono">Importing…</p>':""}
            `}

            ${n?`<p class="text-xs text-red-400 font-semibold">${k(n)}</p>`:""}

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button type="button" id="bulk-q-sample" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-400 font-bold text-xs border border-slate-700">Download sample template</button>
              <button type="button" id="bulk-q-close-2" class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">Close</button>
            </div>
          </div>
        </div>`;const r=()=>{s.innerHTML="",a&&a.created>0&&this.load()};(p=s.querySelector("#bulk-q-close"))==null||p.addEventListener("click",r),(f=s.querySelector("#bulk-q-close-2"))==null||f.addEventListener("click",r),(g=s.querySelector("#bulk-q-sample"))==null||g.addEventListener("click",()=>D.downloadQuestionSample());const l=s.querySelector("#bulk-q-file"),d=s.querySelector("#bulk-q-drop"),c=s.querySelector("#bulk-q-role");let u=(c==null?void 0:c.value)||"";c==null||c.addEventListener("change",()=>{u=c.value});const h=async m=>{var v;const w=u||(c==null?void 0:c.value)||"";i=!0,n="",o();try{if(a=await D.bulkImportQuestions(m,w||void 0),e&&a.created>0){await this.load();for(const j of this.questions)if(w&&j.jobId===w&&!((v=j.tags)!=null&&v.some(he=>he.startsWith("bank:")))){const he=fe.stampQuestionBank(j.tags,e);D.updateQuestion(j.id,{tags:he})}}}catch(j){n=j instanceof V?j.message:"Upload failed. Check format."}finally{i=!1,o()}};l==null||l.addEventListener("change",()=>{var w;const m=(w=l.files)==null?void 0:w[0];m&&h(m)}),d==null||d.addEventListener("dragover",m=>{m.preventDefault()}),d==null||d.addEventListener("drop",m=>{var v,j;m.preventDefault();const w=(j=(v=m.dataTransfer)==null?void 0:v.files)==null?void 0:j[0];w&&h(w)})};o()}}const k=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),jh=t=>t==="coding"?"bg-blue-500/20 text-blue-300":t==="sql"?"bg-purple-500/20 text-purple-300":t==="essay"?"bg-amber-500/20 text-amber-300":t==="msq"?"bg-cyan-500/20 text-cyan-300":"bg-emerald-500/20 text-emerald-300",ad=(t,e,s,a,n=!1)=>`
  <div data-opt-row="${k(t)}" class="flex items-center gap-2">
    <input type="checkbox" class="opt-correct" ${s?"checked":""} title="Correct" ${n?'style="display:none"':""} />
    <span class="text-slate-600 font-mono text-[10px] w-4">${a+1}</span>
    <input class="opt-text glass-input flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-white" value="${k(e)}" placeholder="${n?"Item text":"Option text"}" />
    <button type="button" class="text-slate-500 hover:text-red-400 font-bold px-1" onclick="this.closest('[data-opt-row]')?.remove()" title="Remove">×</button>
  </div>`,Tu=(t,e)=>`
  <div class="tc-input-slot flex items-start gap-2">
    <span class="tc-input-label w-16 shrink-0 pt-2 text-[10px] font-bold text-slate-400">Input ${e+1}</span>
    <textarea class="tc-in flex-1 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Value for this input">${k(t)}</textarea>
    <button type="button" class="remove-tc-input text-slate-500 hover:text-red-400 font-bold px-1 pt-1" title="Remove this input">×</button>
  </div>`,nd=(t,e)=>`
  <div data-tc-row="${k(t.id)}" class="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-bold text-slate-300">Test case ${e+1}</span>
      <button type="button" class="text-slate-500 hover:text-red-400 font-bold text-xs" onclick="this.closest('[data-tc-row]')?.remove()">Remove case</button>
    </div>
    <div class="tc-inputs space-y-2">
      ${pd(t).map((s,a)=>Tu(s,a)).join("")}
    </div>
    <button type="button" class="add-tc-input text-blue-400 text-[11px] font-bold">+ Add input</button>
    <label class="block text-[10px] font-bold text-slate-400">Expected output</label>
    <textarea class="tc-out w-full glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono whitespace-pre" rows="2" placeholder="Expected">${k(t.expectedOutput)}</textarea>
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-1 text-slate-400 text-xs"><input type="checkbox" class="tc-hidden" ${t.isHidden?"checked":""} /> Hidden</label>
      <input type="number" class="tc-weight w-20 glass-input px-2 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white" value="${t.weight}" title="Weight" />
    </div>
  </div>`,Wa={ALL:"All",Applied:"Applied",Screened:"Screened","Assessment Sent":"Invited",Completed:"Submitted","Under Review":"In review",Selected:"Selected",Rejected:"Rejected"},O=t=>String(t??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]);class Ph{constructor(e){b(this,"container");b(this,"currentViewMode","table");b(this,"activeStageTab","ALL");b(this,"selectedJobId","ALL");b(this,"jobStatusFilter","ALL");b(this,"allRows",[]);b(this,"jobs",[]);b(this,"loading",!1);b(this,"error","");this.container=e}render(){const e=Bs(),s=e.kind==="staff"?e.section:"";if(s.startsWith("candidates/")){const n=s.slice(11).split("/")[0];this.container.innerHTML='<div id="recruiter-section"></div>',new Lh(this.container.querySelector("#recruiter-section"),n).render();return}const a=Fs("recruiter");if(a==="assessment-builder"||a==="question-bank"){this.container.innerHTML='<div class="max-w-7xl mx-auto py-8 px-4 lg:px-8"><div id="recruiter-section"></div></div>';const n=this.container.querySelector("#recruiter-section");a==="assessment-builder"?new Sh(n).render():new _h(n).render();return}this.initData(),this.paint()}async initData(){this.loading=!0,this.error="",this.paint();try{const[e,s]=await Promise.all([D.pipeline(),D.jobs().catch(()=>({items:[],total:0}))]);this.allRows=e.items,this.jobs=s.items}catch(e){this.error=e instanceof V?e.message:"Could not load data.",this.allRows=[]}finally{this.loading=!1,this.paint()}}get jobFilteredRows(){if(this.selectedJobId==="ALL")return this.allRows;const e=this.jobs.find(s=>s.id===this.selectedJobId);return e?this.allRows.filter(s=>!!(s.assessmentId&&e.assessmentId&&s.assessmentId===e.assessmentId||s.roleTitle&&e.title&&s.roleTitle.trim().toLowerCase()===e.title.trim().toLowerCase())):this.allRows}get visibleRows(){const e=this.jobFilteredRows;return this.activeStageTab==="ALL"?e:e.filter(s=>s.status===this.activeStageTab)}countFor(e){const s=this.jobFilteredRows;return e==="ALL"?s.length:s.filter(a=>a.status===e).length}jobStats(e){const s=this.allRows.filter(r=>r.assessmentId&&e.assessmentId&&r.assessmentId===e.assessmentId||r.roleTitle&&e.title&&r.roleTitle.trim().toLowerCase()===e.title.trim().toLowerCase()),a=s.length,n=s.filter(r=>r.status==="Completed"||r.totalScore!=null||r.percentage!=null).length,i=s.filter(r=>r.passStatus==="Pass"||r.percentage!=null&&r.percentage>=70).length,o=n>0?Math.round(i/n*100):0;return{applied:a,written:n,passed:i,passPct:o}}paint(){Fs("recruiter")==="candidate-evaluations"?this.paintCandidateAssessmentsHub():this.paintOverviewDashboard()}paintOverviewDashboard(){const e=this.allRows.length,s=this.allRows.filter(p=>p.status==="Completed"||p.totalScore!=null||p.percentage!=null).length,a=this.allRows.filter(p=>p.status==="Assessment Sent").length,n=this.allRows.filter(p=>p.status==="Under Review").length,i=this.allRows.filter(p=>p.status==="Selected").length,o=this.allRows.filter(p=>p.status==="Rejected").length,r=this.allRows.filter(p=>p.passStatus==="Pass"||p.percentage!=null&&p.percentage>=70).length,l=s>0?Math.round(r/s*100):0,d=this.jobs.filter(p=>p.status==="open"),c=this.jobs.filter(p=>p.status==="draft"),u=this.jobs.filter(p=>p.status==="closed"),h=this.jobs.filter(p=>this.jobStatusFilter==="ALL"?!0:p.status===this.jobStatusFilter);this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Executive Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                📊 Executive Dashboard · Talent Operations
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Hiring Pipeline & Assessment Overview</h1>
            <p class="text-xs text-slate-400">High-level operational metrics and active job positions across the enterprise.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button id="nav-evaluations-btn" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all">
              <span>🎯 Go to Candidate Assessments</span>
              <span>→</span>
            </button>
            <button id="view-sent-emails-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Sent invites</button>
            <button id="bulk-invite-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs">Bulk invite</button>
            <button id="invite-cand-btn" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs">+ Invite</button>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">👥 Total Candidates</span>
            <div class="text-2xl font-extrabold font-mono text-white mt-1">${e}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Applied across all jobs</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">✉️ Invited / Sent</span>
            <div class="text-2xl font-extrabold font-mono text-blue-400 mt-1">${a}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Awaiting exam</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">📝 Exams Written</span>
            <div class="text-2xl font-extrabold font-mono text-purple-400 mt-1">${s}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Evaluated answers</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">⏳ In Review</span>
            <div class="text-2xl font-extrabold font-mono text-amber-400 mt-1">${n}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Hold for interview</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">🏆 Selected / Hired</span>
            <div class="text-2xl font-extrabold font-mono text-emerald-400 mt-1">${i}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Hiring decided</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">🚫 Rejected</span>
            <div class="text-2xl font-extrabold font-mono text-rose-400 mt-1">${o}</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">Did not qualify</span>
          </div>

          <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">📈 Pass Rate %</span>
            <div class="text-2xl font-extrabold font-mono ${l>=70?"text-emerald-400":"text-amber-400"} mt-1">${l}%</div>
            <span class="text-[10px] text-slate-500 font-mono mt-0.5">${r} passed cutoff</span>
          </div>
        </div>

        <!-- Pipeline Conversion Funnel Bar -->
        <div class="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold">
            <span class="text-slate-400">📊 Enterprise Candidate Lifecycle Flow</span>
            <span class="text-[11px] font-mono text-slate-500">${s} completed out of ${e} (${e>0?Math.round(s/e*100):0}% completion)</span>
          </div>
          <div class="w-full bg-slate-900 rounded-xl h-3 overflow-hidden flex border border-slate-800 p-0.5">
            ${e>0?`
              <div title="Invited: ${a}" style="width: ${a/e*100}%" class="bg-blue-500 h-full rounded-sm transition-all"></div>
              <div title="Written: ${s}" style="width: ${s/e*100}%" class="bg-purple-500 h-full rounded-sm transition-all"></div>
              <div title="In Review: ${n}" style="width: ${n/e*100}%" class="bg-amber-500 h-full rounded-sm transition-all"></div>
              <div title="Selected: ${i}" style="width: ${i/e*100}%" class="bg-emerald-500 h-full rounded-sm transition-all"></div>
              <div title="Rejected: ${o}" style="width: ${o/e*100}%" class="bg-rose-500 h-full rounded-sm transition-all"></div>
            `:'<div class="w-full bg-slate-800 h-full rounded-sm"></div>'}
          </div>
          <div class="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-400 pt-0.5">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Invited (${a})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Tests Written (${s})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> In Review (${n})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Selected (${i})</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Rejected (${o})</span>
          </div>
        </div>

        <!-- Read-Only Jobs Catalog & Status Board -->
        <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/70 shadow-xl space-y-0">
          <div class="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90">
            <div>
              <h2 class="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                <span>🏢 Active Job Positions Directory</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${this.jobs.length} Positions</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">Read-only job directory. Click 'Evaluate Candidates' on any job to view candidate marks and answer keys.</p>
            </div>

            <!-- Job Status Filter Pills -->
            <div class="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button data-job-status-filter="ALL" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter==="ALL"?"bg-indigo-600 text-white shadow":"text-slate-400 hover:text-white"}">
                All (${this.jobs.length})
              </button>
              <button data-job-status-filter="open" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter==="open"?"bg-emerald-600 text-white shadow":"text-slate-400 hover:text-white"}">
                Open (${d.length})
              </button>
              <button data-job-status-filter="draft" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter==="draft"?"bg-amber-600 text-white shadow":"text-slate-400 hover:text-white"}">
                Draft (${c.length})
              </button>
              <button data-job-status-filter="closed" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.jobStatusFilter==="closed"?"bg-rose-600 text-white shadow":"text-slate-400 hover:text-white"}">
                Closed (${u.length})
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-xs font-mono border-collapse">
              <thead class="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  ${["#","Job Title","Status","Assessment Linked","Sections","Applied","Written","Pass Rate","Created Date","Action"].map(p=>`<th class="px-4 py-3 border-b border-slate-800 whitespace-nowrap font-bold">${p}</th>`).join("")}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${h.length===0?`
                  <tr><td colspan="10" class="px-4 py-12 text-center text-slate-500">No jobs match this status filter.</td></tr>
                `:h.map((p,f)=>{const g=this.jobStats(p),m=p.status==="open"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":p.status==="draft"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-rose-500/10 text-rose-400 border-rose-500/20";return`
                    <tr class="hover:bg-slate-900/40 transition-colors">
                      <td class="px-4 py-3.5 text-slate-500 font-mono">${f+1}</td>
                      <td class="px-4 py-3.5">
                        <span class="font-sans font-bold text-white text-sm block">${O(p.title)}</span>
                        ${p.description?`<span class="font-sans text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">${O(p.description)}</span>`:""}
                      </td>
                      <td class="px-4 py-3.5">
                        <span class="px-2.5 py-0.5 text-[10px] font-bold rounded-lg border uppercase whitespace-nowrap ${m}">
                          ${O(p.status)}
                        </span>
                      </td>
                      <td class="px-4 py-3.5 text-slate-300 font-sans">${O(p.title)} Assessment</td>
                      <td class="px-4 py-3.5 text-indigo-400 font-bold">${p.sectionCount||4} sections</td>
                      <td class="px-4 py-3.5 font-bold text-white">${g.applied}</td>
                      <td class="px-4 py-3.5 font-bold text-purple-400">${g.written}</td>
                      <td class="px-4 py-3.5 font-bold ${g.passPct>=70?"text-emerald-400":"text-amber-400"}">${g.passPct}%</td>
                      <td class="px-4 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">${p.createdAt?new Date(p.createdAt).toLocaleDateString():"—"}</td>
                      <td class="px-4 py-3.5 whitespace-nowrap">
                        <button data-inspect-job="${O(p.id)}" class="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-xs transition-all flex items-center gap-1">
                          <span>Evaluate Candidates</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>`}).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div id="invite-modal-host"></div>
      </div>`,this.attachOverviewEvents()}attachOverviewEvents(){var e,s,a,n;(e=this.container.querySelector("#nav-evaluations-btn"))==null||e.addEventListener("click",()=>{ye.navigate("/recruiter/candidate-assessments")}),this.container.querySelectorAll("[data-job-status-filter]").forEach(i=>{i.addEventListener("click",o=>{this.jobStatusFilter=o.currentTarget.getAttribute("data-job-status-filter"),this.paint()})}),this.container.querySelectorAll("[data-inspect-job]").forEach(i=>{i.addEventListener("click",o=>{const r=o.currentTarget.getAttribute("data-inspect-job");r&&(this.selectedJobId=r,ye.navigate("/recruiter/candidate-assessments"))})}),(s=this.container.querySelector("#view-sent-emails-btn"))==null||s.addEventListener("click",()=>this.renderSentEmailsModal()),(a=this.container.querySelector("#bulk-invite-btn"))==null||a.addEventListener("click",()=>this.renderBulkInvite()),(n=this.container.querySelector("#invite-cand-btn"))==null||n.addEventListener("click",()=>this.renderInviteModal())}paintCandidateAssessmentsHub(){const e=["ALL",...Kl.map(n=>n.status)];this.jobFilteredRows,this.visibleRows;const s=this.jobs.find(n=>n.id===this.selectedJobId),a=s?this.jobStats(s):{applied:this.allRows.length,written:this.allRows.filter(n=>n.status==="Completed"||n.totalScore!=null).length,passed:this.allRows.filter(n=>n.passStatus==="Pass"||n.percentage!=null&&n.percentage>=70).length,passPct:0};!s&&a.written>0&&(a.passPct=Math.round(a.passed/a.written*100)),this.container.innerHTML=`
      <div class="max-w-7xl mx-auto py-8 px-4 lg:px-8 space-y-6">
        <!-- Top Hub Header with Unified Single Export Button -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-xl">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                🎯 Candidate Evaluations · Assessment Tracker
              </span>
            </div>
            <h1 class="text-2xl font-extrabold text-white tracking-tight">Candidate Assessments & Performance Hub</h1>
            <p class="text-xs text-slate-400">Select a job position to evaluate candidate performances, inspect question scorecards, and export reports.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button id="view-table-btn" title="Table layout" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="table"?"bg-indigo-600 text-white shadow":"text-slate-400 hover:text-white"}">Table</button>
              <button id="view-kanban-btn" title="Board layout by stage" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${this.currentViewMode==="kanban"?"bg-indigo-600 text-white shadow":"text-slate-400 hover:text-white"}">Board</button>
            </div>
            <!-- ONE SINGLE PROFESSIONAL EXPORT BUTTON -->
            <button id="unified-export-btn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all">
              <span>📥 Export Assessment Report (CSV)</span>
            </button>
            <button id="invite-cand-btn" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30">+ Invite</button>
          </div>
        </div>

        <!-- Prominent Job Selector Card -->
        <div class="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label class="block text-xs font-extrabold uppercase tracking-wider text-indigo-400 mb-1">
                🎯 Select Job Position / Assessment
              </label>
              <p class="text-xs text-slate-400">Choose a job opportunity to filter candidates and download their evaluation reports.</p>
            </div>
            <div class="w-full sm:w-80">
              <select id="hub-job-select" class="glass-input w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-medium text-xs focus:border-indigo-500 focus:outline-none">
                <option value="ALL" ${this.selectedJobId==="ALL"?"selected":""}>All Positions (${this.allRows.length} candidates)</option>
                ${this.jobs.map(n=>{const i=this.jobStats(n);return`<option value="${O(n.id)}" ${this.selectedJobId===n.id?"selected":""}>${O(n.title)} (${i.applied} applied · ${i.written} written)</option>`}).join("")}
              </select>
            </div>
          </div>

          <!-- Active Job Performance Summary Header -->
          <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                💼
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-white">${O(s?s.title:"All Open & Active Positions")}</h3>
                  ${s?`
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${s.status==="open"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":s.status==="draft"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-rose-500/10 text-rose-400 border-rose-500/20"}">${O(s.status)}</span>
                  `:""}
                </div>
                <p class="text-xs text-slate-400 font-sans mt-0.5">
                  ${s?`Standard Exam · ${s.sectionCount||4} Sections · Passing Cutoff: 70%`:"Viewing combined pipeline across all active jobs"}
                </p>
              </div>
            </div>

            <!-- Job Stats Pills -->
            <div class="flex flex-wrap items-center gap-2.5">
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Applied</span>
                <span class="text-sm font-extrabold font-mono text-white">${a.applied}</span>
              </div>
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Exams Completed</span>
                <span class="text-sm font-extrabold font-mono text-purple-400">${a.written}</span>
              </div>
              <div class="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span class="text-[10px] uppercase text-slate-500 font-bold block">Pass Rate</span>
                <span class="text-sm font-extrabold font-mono ${a.passPct>=70?"text-emerald-400":"text-amber-400"}">${a.passPct}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter by hiring stage tabs -->
        <div>
          <p class="text-[11px] font-semibold text-slate-500 mb-2 px-0.5">Filter by hiring stage</p>
          <div class="glass-panel p-1.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          ${e.map(n=>{const i=this.activeStageTab===n,o=this.countFor(n);return`
              <button data-stage-tab="${n}" class="stage-tab-btn px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border ${i?"bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-sm":"bg-transparent text-slate-400 hover:text-white border-transparent hover:bg-slate-900"}">
                <span>${Wa[n]}</span>
                <span class="px-1.5 py-0.5 text-[10px] font-mono rounded-md ${i?"bg-white/20":"bg-slate-900 text-slate-500"}">${o}</span>
              </button>`}).join("")}
          </div>
        </div>

        ${this.error?`<p class="text-xs text-red-400 font-semibold">${O(this.error)}</p>`:""}
        ${this.loading?'<p class="text-xs text-slate-500 font-mono">Loading candidates…</p>':""}

        <!-- Candidates Table / Kanban View -->
        ${this.currentViewMode==="table"?this.candidateTableHtml():this.candidateKanbanHtml()}

        <div id="invite-modal-host"></div>
      </div>`,this.attachCandidateHubEvents()}candidateTableHtml(){const e=this.visibleRows,s=this.jobs.find(n=>n.id===this.selectedJobId);return`
      <div class="glass-panel p-0 rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/60 shadow-xl">
        <div class="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-white tracking-wide uppercase">${s?`${s.title} · `:""}${Wa[this.activeStageTab]} Candidates</h3>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">${e.length}</span>
          </div>
          <span class="text-[11px] text-slate-400 font-mono">Click candidate name or 'Review' to inspect marks, sections & questions</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1250px] text-left text-xs font-mono border-collapse">
            <thead class="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase text-[10px]">
              <tr>
                ${["#","Candidate Name","Email","Phone","College / Organization","Job Role","Stage","Score","%","Violations","Action"].map(n=>`<th class="px-3.5 py-3 border border-slate-700/80 whitespace-nowrap font-bold">${n}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${e.length===0&&!this.loading?'<tr><td colspan="11" class="px-4 py-12 text-center text-slate-500 border border-slate-800">No candidates match this job and stage filter.</td></tr>':e.map((n,i)=>`
                  <tr class="${i%2===0?"bg-slate-950":"bg-slate-900/50"} hover:bg-slate-800/40 transition-colors">
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-500 text-center">${i+1}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800">
                      <button data-open-cand="${n.id}" class="cand-name-click font-sans font-bold text-indigo-400 hover:text-indigo-300 hover:underline text-left block">
                        ${O(n.name)}
                      </button>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-300">${O(n.email)}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-slate-400 whitespace-nowrap">${O(n.phone||"—")}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-sans text-[11px] text-slate-300 font-medium">
                      <div class="flex items-center gap-1.5 truncate max-w-[180px]" title="${O(n.organization||"Not provided")}">
                        <span class="text-slate-500">🎓</span>
                        <span>${O(n.organization||"—")}</span>
                      </div>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-sans text-[11px] text-slate-300 font-medium">
                      <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">${O(n.roleTitle||"General")}</span>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800">
                      <span class="px-2 py-0.5 text-[10px] font-semibold rounded-md border whitespace-nowrap ${n.status==="Selected"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":n.status==="Rejected"?"bg-rose-500/10 text-rose-400 border-rose-500/20":n.status==="Under Review"?"bg-amber-500/10 text-amber-400 border-amber-500/20":"bg-slate-800 text-slate-200 border-slate-700"}">${O(Wa[n.status]||n.status)}</span>
                    </td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-indigo-400 font-bold">${n.totalScore!=null?`${n.totalScore}/${n.maxScore}`:"—"}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 font-bold ${n.percentage!=null&&n.percentage>=70?"text-emerald-400":n.percentage!=null?"text-rose-400":"text-slate-500"}">${n.percentage!=null?`${n.percentage}%`:"—"}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 text-center ${n.violations>0?"text-amber-400 font-bold":"text-slate-400"}">${n.violations}</td>
                    <td class="px-3.5 py-2.5 border border-slate-800 whitespace-nowrap">
                      <button data-open-cand="${n.id}" class="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shadow-sm transition-all flex items-center gap-1">
                        <span>Review</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>`).join("")}
            </tbody>
          </table>
        </div>
      </div>`}candidateKanbanHtml(){const e=this.activeStageTab==="ALL"?Kl.map(a=>a.status):[this.activeStageTab],s=this.jobFilteredRows;return`
      <div class="flex gap-5 overflow-x-auto pb-6 pt-2">
        ${e.map(a=>{const n=s.filter(i=>i.status===a);return`
            <div class="glass-panel p-4 rounded-3xl border border-slate-800/80 flex flex-col w-[310px] shrink-0 bg-slate-950/90 space-y-3">
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 class="text-xs font-bold text-white tracking-wide">${Wa[a]||a}</h3>
                <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-900 text-indigo-400 border border-slate-800 rounded-full">${n.length}</span>
              </div>
              <div class="space-y-3 flex-1 overflow-y-auto max-h-[620px]">
                ${n.map(i=>`
                  <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 cursor-pointer space-y-2.5 transition-all" data-open-cand="${i.id}">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="text-xs font-bold text-white hover:text-indigo-400">${O(i.name)}</h4>
                        <p class="text-[11px] text-slate-400 font-mono truncate max-w-[160px]">${O(i.email)}</p>
                        ${i.organization?`<p class="text-[10px] text-slate-500 font-sans mt-0.5 truncate max-w-[160px]">🎓 ${O(i.organization)}</p>`:""}
                      </div>
                      <span class="text-[10px] font-mono text-slate-500">${i.experienceYears}y</span>
                    </div>
                    ${i.percentage!=null?`<p class="text-xs font-extrabold font-mono ${i.percentage>=70?"text-emerald-400":"text-rose-400"}">Score: ${i.percentage}% (${i.totalScore}/${i.maxScore})</p>`:'<p class="text-[11px] text-slate-500">Awaiting assessment</p>'}
                  </div>`).join("")||`
                  <div class="p-5 text-center border border-dashed border-slate-800/80 rounded-2xl text-xs text-slate-500">No candidates in this stage.</div>`}
              </div>
            </div>`}).join("")}
      </div>`}attachCandidateHubEvents(){var s,a,n,i;const e=this.container.querySelector("#hub-job-select");e==null||e.addEventListener("change",()=>{this.selectedJobId=e.value,this.paint()}),this.container.querySelectorAll(".stage-tab-btn").forEach(o=>{o.addEventListener("click",r=>{this.activeStageTab=r.currentTarget.getAttribute("data-stage-tab"),this.paint()})}),(s=this.container.querySelector("#view-table-btn"))==null||s.addEventListener("click",()=>{this.currentViewMode="table",this.paint()}),(a=this.container.querySelector("#view-kanban-btn"))==null||a.addEventListener("click",()=>{this.currentViewMode="kanban",this.paint()}),this.container.querySelectorAll("[data-open-cand]").forEach(o=>{o.addEventListener("click",r=>{r.stopPropagation();const l=r.currentTarget.getAttribute("data-open-cand");l&&ye.navigate(`/recruiter/candidates/${l}`)})}),(n=this.container.querySelector("#unified-export-btn"))==null||n.addEventListener("click",()=>this.exportUnifiedReport()),(i=this.container.querySelector("#invite-cand-btn"))==null||i.addEventListener("click",()=>this.renderInviteModal())}exportUnifiedReport(){const e=this.jobFilteredRows,s=this.jobs.find(l=>l.id===this.selectedJobId),a=s?s.title.replace(/\s+/g,"_"):"All_Positions",n=new Set;e.forEach(l=>{l.sectionScores&&Object.keys(l.sectionScores).forEach(d=>{d.startsWith("_")||n.add(d)})});const i=Array.from(n),o=["Candidate ID","Candidate Name","Email","Phone","College / Organization","Job Position / Role","Hiring Status","Total Score","Max Score","Overall Percentage (%)","Pass / Fail Status",...i.map(l=>`${l} (Score)`),...i.map(l=>`${l} (%)`),"Proctoring Violations","Recruiter Decision","Recruiter Notes"],r=e.map(l=>{var h,p;const d=l.sectionScores||{},c=i.map(f=>{const g=d[f];return g?`${g.score}/${g.maxScore}`:"N/A"}),u=i.map(f=>{const g=d[f];return g&&g.percentage!=null?`${g.percentage}%`:"N/A"});return[l.id,l.name,l.email,l.phone||"",l.organization||"Not provided",l.roleTitle||(s==null?void 0:s.title)||"General",l.status,l.totalScore??"N/A",l.maxScore??"N/A",l.percentage!=null?`${l.percentage}%`:"N/A",l.passStatus??"N/A",...c,...u,l.violations,((h=l.result)==null?void 0:h.recruiterDecision)||l.status||"",((p=l.result)==null?void 0:p.recruiterNotes)||""]});ku.downloadCsv(`${a}_Candidate_Assessment_Report.csv`,o,r)}renderSentEmailsModal(){var a;const e=Xi.getSentEmails(),s=this.container.querySelector("#invite-modal-host");s&&(s.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 flex flex-col bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
            <div>
              <h3 class="text-base font-extrabold text-white">Sent invites</h3>
              <p class="text-[11px] text-slate-500 mt-0.5">${e.length} in this session</p>
            </div>
            <button id="close-email-log-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="overflow-auto flex-1 p-4">
            ${e.length?`
              <table class="w-full text-xs font-mono">
                <thead class="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th class="text-left font-semibold px-4 py-3">Recipient</th>
                    <th class="text-left font-semibold px-4 py-3">Link</th>
                    <th class="text-left font-semibold px-4 py-3">Dev Passcode</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${e.map(n=>`
                    <tr>
                      <td class="px-4 py-3 text-white">${O(n.recipientName)} &lt;${O(n.recipientEmail)}&gt;</td>
                      <td class="px-4 py-3 text-indigo-400 truncate max-w-xs">${O(n.assessmentLink||"—")}</td>
                      <td class="px-4 py-3 text-amber-300 font-bold">${O(n.otpCode||"—")}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            `:'<p class="text-center text-slate-500 py-10">No invites sent in this session yet.</p>'}
          </div>
        </div>
      </div>`,(a=s.querySelector("#close-email-log-btn"))==null||a.addEventListener("click",()=>{s.innerHTML=""}))}renderBulkInvite(){const e=this.container.querySelector("#invite-modal-host");e&&this.openBulkInvite(e)}async openBulkInvite(e){var a,n;let s=[];try{s=(await D.jobs()).items.filter(o=>o.status==="open")}catch(i){alert(i instanceof V?i.message:"Could not load jobs.");return}if(!s.length){alert("No open job. Set a job to open and save it before sending invitations.");return}if(s.length===1){new sd(e,s[0].assessmentId,s[0].title).open();return}e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-5 bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Bulk invite</h3>
            <button id="bulk-job-close" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <label class="block font-semibold text-slate-300 mb-1">Select Job</label>
            <select id="bulk-job" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
              ${s.map(i=>`<option value="${O(i.id)}">${O(i.title)} · ${O(i.status)}</option>`).join("")}
            </select>
            <button id="bulk-job-next" class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Continue</button>
          </div>
        </div>
      </div>`,(a=e.querySelector("#bulk-job-close"))==null||a.addEventListener("click",()=>{e.innerHTML=""}),(n=e.querySelector("#bulk-job-next"))==null||n.addEventListener("click",()=>{const i=e.querySelector("#bulk-job").value,o=s.find(r=>r.id===i);o&&new sd(e,o.assessmentId,o.title).open()})}renderInviteModal(){const e=this.container.querySelector("#invite-modal-host");e&&this.openInviteModal(e)}async openInviteModal(e){var i;let s=[];try{s=(await D.jobs()).items.filter(r=>r.status==="open")}catch{s=[]}e.innerHTML=`
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="glass-panel w-full max-w-xl rounded-3xl border border-slate-800 p-6 space-y-5 shadow-2xl bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 class="text-base font-extrabold text-white">Invite candidate</h3>
            <button id="close-invite-btn" class="text-slate-400 hover:text-white font-bold">✕</button>
          </div>
          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Candidate Name</label>
              <input id="inv-name" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="Full name" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Email</label>
              <input id="inv-email" type="email" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white" value="" placeholder="candidate@company.com" autocomplete="off" />
            </div>
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Job</label>
              ${s.length?`
                <select id="inv-assess" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white">
                  ${s.map(o=>`<option value="${O(o.assessmentId)}">${O(o.title)} · ${O(o.status)}</option>`).join("")}
                </select>
              `:'<p class="text-amber-400 text-[11px]">No open job. Set a job to open and save it before sending an invitation.</p>'}
            </div>
            <button id="send-inv-btn" ${s.length?"":"disabled"} class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold">Send invitation</button>
            <div id="dispatch-output-box" class="hidden p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <p id="dispatch-msg-text"></p>
            </div>
          </div>
        </div>
      </div>`;const a=o=>{o==null||o.addEventListener("focus",()=>{o.value.trim()&&o.select()})};a(e.querySelector("#inv-name")),a(e.querySelector("#inv-email")),(i=e.querySelector("#close-invite-btn"))==null||i.addEventListener("click",()=>{e.innerHTML="",this.initData()});const n=e.querySelector("#send-inv-btn");n==null||n.addEventListener("click",async()=>{var c;const o=e.querySelector("#inv-name").value.trim(),r=e.querySelector("#inv-email").value.trim(),l=e.querySelector("#inv-assess"),d=((c=l==null?void 0:l.value)==null?void 0:c.trim())||"";if(!o)return alert("Please enter the candidate name.");if(!r)return alert("Please enter the candidate email address.");if(!d)return alert("Please select a job.");n.disabled=!0,n.textContent="Sending invitation…";try{const u=await L.createInvite({name:o,email:r,assessmentId:d,expiresInHours:48});Xi.recordInvite(o,r,u.link,u.devOtp,{assessmentTitle:u.assessmentTitle||void 0,durationMinutes:u.durationMinutes??void 0,expiresAt:u.expiresAt});const h=e.querySelector("#dispatch-output-box"),p=e.querySelector("#dispatch-msg-text");h==null||h.classList.remove("hidden");const f=u.devOtp?` <span class="text-amber-300">(DEV OTP: <strong>${O(u.devOtp)}</strong>)</span>`:"";p&&(p.innerHTML=`Sending the invitation to <strong>${O(u.otpDestination)}</strong>…${f}`),n.textContent="✓ Invitation created";const g=Date.now()+2e4;for(;Date.now()<g&&p;){await new Promise(w=>window.setTimeout(w,1e3));let m;try{m=await L.inviteDelivery(u.inviteId)}catch{continue}if(m.deliveryStatus==="SENT"){p.innerHTML=`Invitation emailed to <strong>${O(u.otpDestination)}</strong>, the address entered above. Check that inbox, then Spam and Promotions.${f}`,n.textContent="✓ Invitation emailed";break}if(m.deliveryStatus==="FAILED"){p.innerHTML=`The invitation was saved, but the email was not delivered. ${O(m.message||"Check System Admin email settings.")}`,n.textContent="Email failed",n.disabled=!1;break}}p&&n.textContent==="✓ Invitation created"&&(p.innerHTML=`The invitation is saved for <strong>${O(u.otpDestination)}</strong>. The email is still going out — check the inbox, then Spam and Promotions.${f}`)}catch(u){alert(u instanceof V?u.message:"Invite failed."),n.disabled=!1,n.textContent="Send invitation"}})}}class Dh{constructor(e,s){this.container=e,this.portal=s}render(){var i;const e=y.getState(),s=e.currentUser,a=jt[this.portal],n=e.allowedPortals.map(o=>jt[o]);this.container.innerHTML=`
      <div class="max-w-md mx-auto py-16 px-4">
        <div class="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-5">
          <div class="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mx-auto flex items-center justify-center text-2xl">⛔</div>
          <div>
            <h2 class="text-2xl font-extrabold text-white tracking-tight">Access denied</h2>
            <p class="text-xs text-slate-400 mt-2 leading-relaxed">
              You are signed in as <b class="text-slate-200">${(s==null?void 0:s.name)??""}</b> (${(s==null?void 0:s.role)??""}).
              That role cannot open the <b class="text-slate-200">${a.title}</b>.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            ${n.map(o=>`
              <button data-go="${o.path}" class="go-btn w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider transition-all">
                ${o.icon} Go to ${o.title}
              </button>
            `).join("")}
            <button id="denied-logout" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all">
              🚪 Sign out to use a different account
            </button>
          </div>
        </div>
      </div>
    `,this.container.querySelectorAll(".go-btn").forEach(o=>o.addEventListener("click",r=>ye.navigate(r.currentTarget.getAttribute("data-go")||"/"))),(i=this.container.querySelector("#denied-logout"))==null||i.addEventListener("click",()=>{y.logoutStaff().catch(()=>{})})}}const qh=t=>t instanceof V?t.message:"Something went wrong. Please try again.",yi=8;function Rh(t,e){var d,c,u,h;const s=jt[e.portal],a=y.getState().currentUser;t.innerHTML=`
    <div class="glass-panel w-full max-w-md mx-auto rounded-3xl border border-slate-800 p-8 space-y-5 shadow-2xl">
      <div class="flex items-center gap-3 border-b border-slate-800 pb-4">
        <span class="text-2xl">🔑</span>
        <div class="flex-1">
          <h2 class="text-lg font-extrabold text-white">${e.forced?"Set your new password":"Change password"}</h2>
          <p class="text-[11px] text-slate-400 mt-0.5">${e.forced?`Your administrator issued a temporary password for the ${s.loginTitle}. Choose your own to continue.`:"You will be signed out of your other devices."}</p>
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
          <input id="pw-new" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" placeholder="At least ${yi} characters" />
        </div>
        <div>
          <label class="block font-semibold text-slate-300 mb-1" for="pw-confirm">Confirm new password</label>
          <input id="pw-confirm" type="password" autocomplete="new-password" class="glass-input w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white font-mono" />
        </div>
        <button id="pw-submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider shadow-lg shadow-blue-600/30 transition-all disabled:opacity-60">
          UPDATE PASSWORD ➔
        </button>
        <div class="flex items-center justify-between text-[11px] text-slate-500">
          <span>Signed in as <b class="text-slate-300">${a?a.email.replace(/[<>&"]/g,""):""}</b></span>
          ${e.forced?'<button id="pw-logout" type="button" class="font-semibold text-slate-400 hover:text-white">Sign out</button>':'<button id="pw-cancel" type="button" class="font-semibold text-slate-400 hover:text-white">Cancel</button>'}
        </div>
      </div>
    </div>
  `;const n=p=>t.querySelector(p),i=n("#pw-error"),o=p=>{i&&(i.textContent=p,i.classList.toggle("hidden",!p))},r=n("#pw-submit"),l=()=>{var m,w,v;const p=((m=n("#pw-current"))==null?void 0:m.value)||"",f=((w=n("#pw-new"))==null?void 0:w.value)||"",g=((v=n("#pw-confirm"))==null?void 0:v.value)||"";if(!p||!f)return o("Fill in all the fields.");if(f.length<yi)return o(`New password must be at least ${yi} characters.`);if(f!==g)return o("The new passwords do not match.");if(f===p)return o("Choose a password different from the current one.");o(""),r&&(r.disabled=!0),L.changePassword(e.portal,p,f).then(j=>{var he;y.loginStaff(j.user),(he=e.onCancel)==null||he.call(e)}).catch(j=>{o(qh(j)),r&&r.isConnected&&(r.disabled=!1)})};r==null||r.addEventListener("click",l),t.querySelectorAll("input").forEach(p=>p.addEventListener("keydown",f=>{f.key==="Enter"&&l()})),(d=n("#pw-logout"))==null||d.addEventListener("click",()=>{y.logoutStaff().catch(()=>{})}),(c=n("#pw-cancel"))==null||c.addEventListener("click",()=>{var p;return(p=e.onCancel)==null?void 0:p.call(e)}),(u=n("#pw-cancel-x"))==null||u.addEventListener("click",()=>{var p;return(p=e.onCancel)==null?void 0:p.call(e)}),(h=n("#pw-current"))==null||h.focus()}class Oh{constructor(e,s){this.container=e,this.portal=s}render(){this.container.innerHTML='<div class="py-16 px-4"><div id="forced-pw-host"></div></div>',Rh(this.container.querySelector("#forced-pw-host"),{portal:this.portal,forced:!0})}}const _={portal:null,step:"credentials",email:"",challengeId:"",otpDestination:"",devOtp:"",info:"",showPassword:!1};function id(t){_.portal=t,_.step="credentials",_.email="",_.challengeId="",_.otpDestination="",_.devOtp="",_.info="",_.showPassword=!1}const Qa=t=>t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e]),Fh=t=>t instanceof V?t.message:"Something went wrong. Please try again.";class Bh{constructor(e,s){b(this,"container");b(this,"portal");this.container=e,this.portal=s,_.portal!==s&&id(s)}render(){const e=jt[this.portal],s=ya[this.portal],a=y.getState().theme==="light";this.container.innerHTML=`
      <div class="relative min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 sm:px-6">
        
        <!-- Ambient Radial Aura tailored to this portal's color -->
        <div class="absolute inset-0 pointer-events-none opacity-50"
             style="background:radial-gradient(circle 500px at 50% 40%, ${s.accentLight}, transparent 70%)"></div>

        <div class="relative w-full max-w-md space-y-6">
          
          <!-- Authentication Card -->
          <div class="rounded-3xl border shadow-2xl p-7 sm:p-9 space-y-6 transition-all backdrop-blur-xl
                      ${a?"bg-white/95 border-slate-200/90 text-slate-800 shadow-slate-200/50":"bg-slate-900/90 border-slate-800 text-slate-100 shadow-black/60"}">
            
            <!-- Card Header & Portal Brand -->
            <div class="space-y-4 border-b pb-5 ${a?"border-slate-100":"border-slate-800/80"}">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                     style="background:${s.accentLight}; border:1px solid ${s.accentBorder}">
                  ${s.icon}
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full font-mono shadow-sm"
                      style="background:${s.accentLight}; color:${s.accentColor}; border:1px solid ${s.accentBorder}">
                  ${s.badge}
                </span>
              </div>

              <div>
                <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight ${a?"text-slate-900":"text-white"}">
                  ${e.loginTitle}
                </h1>
                <p class="text-xs ${a?"text-slate-500":"text-slate-400"} mt-1 leading-relaxed">
                  ${e.blurb}
                </p>
              </div>

              <!-- Two-Step Progress Pill -->
              <div class="flex items-center gap-2 pt-1">
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${_.step==="credentials"?"bg-blue-600 text-white":"bg-emerald-600 text-white"}">
                    ${_.step==="credentials"?"1":"✓"}
                  </div>
                  <span class="text-[11px] font-semibold ${_.step==="credentials"?a?"text-slate-900":"text-white":"text-emerald-500"}">Credentials</span>
                </div>
                <div class="w-6 h-0.5 ${_.step==="otp"?"bg-emerald-500":a?"bg-slate-200":"bg-slate-800"}"></div>
                <div class="flex-1 flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${_.step==="otp"?"bg-emerald-600 text-white":a?"bg-slate-200 text-slate-500":"bg-slate-800 text-slate-400"}">
                    2
                  </div>
                  <span class="text-[11px] font-semibold ${_.step==="otp"?"text-emerald-500":a?"text-slate-400":"text-slate-500"}">2FA Passcode</span>
                </div>
              </div>
            </div>

            <!-- Inline Alert Messages -->
            <p id="login-error" class="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl hidden"></p>
            <p id="login-info" class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl ${_.info?"":"hidden"}">${Qa(_.info)}</p>

            <!-- Form Content -->
            ${_.step==="credentials"?this.credentialsHtml(s,a):this.otpHtml(s,a)}

            <!-- Security Notice -->
            <div class="pt-4 border-t ${a?"border-slate-100 text-slate-400":"border-slate-800/80 text-slate-500"} text-[11px] text-center space-y-1">
              <p>Staff accounts are issued by System Administrators.</p>
              <p class="font-mono text-[10px]">🔒 256-bit Encrypted Session · MFA Enforced</p>
            </div>
          </div>

          <!-- Quick Workspace Switcher Bar -->
          <div class="rounded-2xl border p-3.5 text-center transition-all ${a?"bg-white/80 border-slate-200":"bg-slate-900/60 border-slate-800"} backdrop-blur-md">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Switch Workspace</p>
            <div class="grid grid-cols-3 gap-2">
              ${fd.map(n=>{const i=n===this.portal,o=ya[n];return`
                  <button type="button" data-switch-portal="${n}"
                          class="py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border
                                 ${i?"bg-blue-600/10 text-blue-500 border-blue-500/30":a?"bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200":"bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800"}"
                          ${i?"disabled":""}>
                    <span>${o.icon}</span>
                    <span class="truncate">${o.key==="admin"?"Admin":o.key==="recruiter"?"Recruiter":"Proctor"}</span>
                  </button>
                `}).join("")}
            </div>
          </div>

        </div>
      </div>
    `,this.attachEvents()}credentialsHtml(e,s){return`
      <div class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"} mb-1.5" for="login-email">
            Staff Username or Email
          </label>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
            <input id="login-email" type="text" autocomplete="username" value="${Qa(_.email)}"
              class="w-full pl-9 pr-3.5 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${s?"bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800":"bg-slate-950 border-slate-700 focus:border-blue-500 text-white"}"
              placeholder="username or email" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"}" for="login-password">
              Password
            </label>
            <span class="text-[10px] text-slate-400">Managed by Admin</span>
          </div>
          <div class="relative">
            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
            <input id="login-password" type="${_.showPassword?"text":"password"}" autocomplete="current-password" value=""
              class="w-full pl-9 pr-10 py-3 rounded-xl border font-mono text-xs transition-all outline-none
                     ${s?"bg-slate-50 border-slate-300 focus:border-blue-600 text-slate-800":"bg-slate-950 border-slate-700 focus:border-blue-500 text-white"}"
              placeholder="••••••••••••" />
            <button id="toggle-pwd-btn" type="button" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs">
              ${_.showPassword?"👁️":"👁️‍🗨️"}
            </button>
          </div>
        </div>

        <button id="submit-creds-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r ${e.gradient} ${e.hoverGradient}">
          <span>SEND 2FA EMAIL PASSCODE</span>
          <span>➔</span>
        </button>
      </div>
    `}otpHtml(e,s){return`
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
          <div class="flex items-center gap-2 font-bold text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Two-Factor Code Sent</span>
          </div>
          <p class="text-[11px] ${s?"text-slate-600":"text-slate-300"} leading-relaxed">
            A 6-digit one-time passcode was dispatched to <strong class="font-mono font-bold text-emerald-500">${Qa(_.otpDestination)}</strong>. Code expires in 10 minutes.
          </p>
        </div>

        ${_.devOtp?`
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center justify-between">
            <div>🧪 DEV OTP: <strong class="font-mono tracking-widest text-white">${Qa(_.devOtp)}</strong></div>
            <button id="dev-autofill-btn" type="button" class="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-[10px] font-bold text-amber-200">
              Auto-fill
            </button>
          </div>
        `:""}

        <div>
          <label class="block font-semibold ${s?"text-slate-700":"text-slate-300"} mb-1.5 text-center" for="login-otp-input">
            Enter 6-Digit Email Passcode
          </label>
          <input id="login-otp-input" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value=""
            class="w-full px-4 py-3.5 rounded-xl text-center font-mono text-2xl tracking-[0.6em] font-bold border transition-all outline-none
                   ${s?"bg-slate-50 border-slate-300 focus:border-emerald-600 text-emerald-600":"bg-slate-950 border-slate-700 focus:border-emerald-500 text-emerald-400"}"
            placeholder="------" />
        </div>

        <button id="verify-otp-btn"
                class="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
          <span>VERIFY PASSCODE & SIGN IN</span>
          <span>➔</span>
        </button>

        <div class="flex items-center justify-between pt-1">
          <button id="resend-otp-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            Didn't receive code? Resend
          </button>
          <button id="back-btn" type="button" class="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
            ← Use different account
          </button>
        </div>
      </div>
    `}showError(e){var a;const s=this.container.querySelector("#login-error");s&&(s.textContent=e,s.classList.toggle("hidden",!e),e&&((a=this.container.querySelector("#login-info"))==null||a.classList.add("hidden")))}run(e,s){const a=e;a&&(a.disabled=!0),this.showError(""),s().catch(n=>this.showError(Fh(n))).finally(()=>{a&&a.isConnected&&(a.disabled=!1)}).catch(()=>{})}onEnter(e,s){e==null||e.addEventListener("keydown",a=>{a.key==="Enter"&&(s==null||s.click())})}attachEvents(){var i,o,r;const e=l=>this.container.querySelector(l);if(this.container.querySelectorAll("[data-switch-portal]").forEach(l=>{l.addEventListener("click",()=>{const d=l.getAttribute("data-switch-portal");d&&d!==this.portal&&ye.navigate(jt[d].path)})}),_.step==="credentials"){const l=e("#login-email"),d=e("#login-password"),c=e("#submit-creds-btn"),u=e("#toggle-pwd-btn");this.onEnter(l,c),this.onEnter(d,c),(i=l!=null&&l.value?d:l)==null||i.focus(),u==null||u.addEventListener("click",()=>{_.showPassword=!_.showPassword,d&&(d.type=_.showPassword?"text":"password"),u&&(u.textContent=_.showPassword?"👁️":"👁️‍🗨️")}),c==null||c.addEventListener("click",()=>{const h=((l==null?void 0:l.value)||"").trim(),p=(d==null?void 0:d.value)||"";if(_.email=h,!h||!p){this.showError("Enter your username or email and password.");return}this.run(c,async()=>{c&&(c.innerHTML="<span>Sending 2FA passcode…</span>");const f=await L.login(this.portal,h,p);_.challengeId=f.challengeId,_.otpDestination=f.otpDestination,_.devOtp=f.devOtp||"",_.step="otp",_.info="",this.render()})});return}const s=e("#login-otp-input"),a=e("#verify-otp-btn"),n=e("#dev-autofill-btn");this.onEnter(s,a),s==null||s.focus(),n==null||n.addEventListener("click",()=>{s&&_.devOtp&&(s.value=_.devOtp,s.focus())}),a==null||a.addEventListener("click",()=>{const l=((s==null?void 0:s.value)||"").trim();if(l.length!==6){this.showError("Enter the 6-digit passcode.");return}this.run(a,async()=>{const d=await L.verifyOtp(this.portal,_.challengeId,l);id(this.portal),y.loginStaff(d.user)})}),(o=e("#resend-otp-btn"))==null||o.addEventListener("click",l=>{this.run(l.currentTarget,async()=>{const d=await L.resendOtp(this.portal,_.challengeId);_.challengeId=d.challengeId,_.devOtp=d.devOtp||"",_.info="A new passcode has been dispatched to your email.",this.render()})}),(r=e("#back-btn"))==null||r.addEventListener("click",()=>{_.step="credentials",_.challengeId="",_.devOtp="",_.info="",this.render()})}}class Nh{constructor(){b(this,"appElement");b(this,"navbarHost");b(this,"contentHost");b(this,"footerHost");b(this,"restoring",new Set);b(this,"wasStaffAuthenticated",!1);this.appElement=document.getElementById("app"),this.appElement.innerHTML=`
      <div id="app-shell" class="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <div id="navbar-host" class="sticky top-0 z-50"></div>
        <main id="content-host" class="flex-1"></main>
        <div id="footer-host"></div>
      </div>
    `,this.navbarHost=document.getElementById("navbar-host"),this.contentHost=document.getElementById("content-host"),this.footerHost=document.getElementById("footer-host"),y.subscribe(()=>this.render()),ye.subscribe(()=>{this.syncSession(Bs()).catch(e=>console.error("Session restore failed",e)),this.render()})}async syncSession(e){if(e.kind!=="staff")return;const s=e.portal;if(y.getState().isStaffAuthenticated){L.setActivePortal(s);return}if(!this.restoring.has(s)){this.restoring.add(s),y.setAuthReady(!1);try{const n=await L.restoreSession(s);n&&y.loginStaff(n.user)}catch(n){console.error("Session restore failed",n)}finally{this.restoring.delete(s),y.setAuthReady(!0)}}}render(){new zu(this.navbarHost).render();const s=y.getState(),a=Bs(),n=s.examStarted&&!s.examCompleted,i=a.kind==="staff"&&s.isStaffAuthenticated&&!!s.currentUser,o=!n,r=document.getElementById("app-shell");if(r&&(r.className="min-h-screen flex flex-col bg-slate-950 text-slate-100"),o){const u=i?"small":"full";new Qu(this.footerHost,u).render()}else this.footerHost.innerHTML="";if(s.isStaffAuthenticated!==this.wasStaffAuthenticated&&(this.wasStaffAuthenticated=s.isStaffAuthenticated,Wu()),a.kind==="staff"&&(Ju(a.portal,a.section),s.isStaffAuthenticated&&!a.section)){const u=eo(a.portal);u!==window.location.pathname&&window.history.replaceState({},"",u)}if(this.contentHost.innerHTML="",a.kind==="candidate"){new vn(this.contentHost).render(),s.otpVerified?ba.mount():ba.hide();return}ba.hide();const l=a.portal;if(!s.authReady){this.contentHost.innerHTML=`
        <div class="py-24 text-center text-xs text-slate-500 font-mono">Checking your session…</div>
      `;return}if(!s.isStaffAuthenticated||!s.currentUser){new Bh(this.contentHost,l).render();return}if(!s.allowedPortals.includes(l)){new Dh(this.contentHost,l).render();return}if(s.currentUser.mustChangePassword){new Oh(this.contentHost,l).render();return}const d=this.navbarHost.offsetHeight;this.contentHost.innerHTML=`
      <div class="flex flex-col md:flex-row md:items-start flex-1 min-h-[calc(100vh-110px)]">
        <aside id="sidebar-host"
          class="glass-panel w-full md:w-64 md:shrink-0 rounded-none border-0 border-b md:border-b-0 md:border-r border-slate-800 p-3 md:sticky md:overflow-y-auto"
          style="${d?`top:${d}px;height:calc(100vh - ${d}px - 44px)`:""}"></aside>
        <div id="portal-host" class="flex-1 min-w-0"></div>
      </div>
    `,new Ku(this.contentHost.querySelector("#sidebar-host"),l).render();const c=this.contentHost.querySelector("#portal-host");l==="admin"?new Tp(c).render():l==="recruiter"?new Ph(c).render():new Yi(c).render()}}document.addEventListener("DOMContentLoaded",async()=>{const t=new URLSearchParams(window.location.search).get("invite"),e=Fu();t&&(e==null?void 0:e.inviteToken)===t&&L.getCandidateToken()?y.hydrateExam(e):t&&(e==null?void 0:e.inviteToken)===t&&e.codeDrafts?y.seedCodeDrafts(e.codeDrafts):e&&t&&e.inviteToken!==t&&L.clearCandidateSession(),window.addEventListener("pagehide",()=>{is(),y.flushExamProgress()});const s=new Nh;s.render();try{await s.syncSession(Bs())}catch(a){console.error("Session restore failed",a)}finally{y.markAuthReady()}});window.addEventListener("unhandledrejection",t=>{console.error("Unhandled promise rejection:",t.reason)});
//# sourceMappingURL=index-DkZYbdNR.js.map
