// client/src/utils/studentsTrackerConfig.js

// --- MARK MAPPING HELPER ---
const createMarkMap = (options) => new Map(options.map(opt => [opt.value, opt.marks]));

const presentationOptions = [
    { value: "Looks Highly Professional and Well groomed", marks: 4, label: "Looks Highly Professional and Well groomed" }, { value: "Looks like Native person, but well groomed", marks: 3, label: "Looks like Native person, but well groomed" }, { value: "Looks professional, and not well groomed", marks: 2, label: "Looks professional, and not well groomed" }, { value: "Not groomed and not professional", marks: 1, label: "Not groomed and not professional" }, { value: "NA", marks: 0, label: "NA" } ];

// --- MODIFIED ARRAY ---
const communicationOptions = [ 
    { value: "Confident & Fluent", marks: 4, label: "Confident & Fluent" }, 
    { value: "Confident & Not Fluent", marks: 3, label: "Confident & Not Fluent" }, 
    { value: "Not Confident & Fluent", marks: 2, label: "Not Confident & Fluent" }, // <-- ADDED THIS LINE
    { value: "Not Confident & Not Fluent", marks: 1, label: "Not Confident & Not Fluent" }, 
    { value: "NA", marks: 0, label: "NA" } 
];

const theoryOptions = [ { value: "Able to Answer", marks: 4, label: "Able to Answer" }, { value: "Able to tell approach, unable to solve", marks: 3, label: "Able to tell approach, unable to solve" }, { value: "Understood the question, Unable to tell approach", marks: 2, label: "Understood the question, Unable to tell approach" }, { value: "Unable to understand the question", marks: 1, label: "Unable to understand the question" }, { value: "NA", marks: 0, label: "NA" } ];
const codingOptions = theoryOptions;
const projectExplanationOptions = [ { value: "Telling specific details about the project", marks: 4, label: "Telling specific details about the project" }, { value: "Telling in abstract way", marks: 2, label: "Telling in abstract way" }, { value: "NA", marks: 0, label: "NA" } ];
const probabilityOptions = [ { value: "Certain / Guaranteed (75%-100%)", label: "Certain / Guaranteed (75%-100%)" }, { value: "Likely / Fairly possible (50%-75%)", label: "Likely / Fairly possible (50%-75%)" }, { value: "Moderate (20%-50%)", label: "Moderate (20%-50%)" }, { value: "Impossible (0%-20%)", label: "Impossible (0%-20%)" }, { value: "NA", label: "NA" }];

const companyInteractionQualityOptions = [ { value: "The candidate(s) were confident, articulate, asked relevant questions, and showed strong enthusiasm. Very promising.", marks: 4, label: "Very Promising (Confident, articulate, strong enthusiasm)" }, { value: "The interaction was smooth. The candidate(s) communicated well, were attentive, and showed decent understanding.", marks: 3, label: "Smooth (Good communication, decent understanding)" }, { value: "The candidate(s) were moderately prepared. There were some gaps in communication or clarity, but potential exists.", marks: 2, label: "Moderately Prepared (Some gaps, but potential exists)" }, { value: "The candidate(s) had difficulty expressing themselves, seemed underprepared, or lacked clarity in responses.", marks: 1, label: "Underprepared (Difficulty expressing, lacked clarity)" }, { value: "The candidate(s) were unresponsive, disengaged, or lacked basic fit for the role.", marks: 0, label: "Unresponsive/Disengaged" }];
const incrutierSelfIntroOptions = [ { value: "Well-organized, engaging, and detailed introduction", marks: 4, label: "Well-organized, engaging, and detailed" }, { value: "Includes relevant details and provides a good overview", marks: 3, label: "Includes relevant details and good overview" }, { value: "Clear introduction with minimal details", marks: 2, label: "Clear with minimal details" }, { value: "Basic introduction with limited details", marks: 1, label: "Basic with limited details" }, { value: "Lacks basic details and context", marks: 0, label: "Lacks basic details" } ];
const incrutierProjectExpOptions = [ { value: "Excellent", marks: 4, label: "Excellent" }, { value: "Good", marks: 3, label: "Good" }, { value: "Average", marks: 2, label: "Average" }, { value: "Poor", marks: 1, label: "Poor" }, { value: "Very Poor", marks: 0, label: "Very Poor" } ];
const incrutierCommSkillsOptions = [ { value: "Exceptional communication skills", marks: 4, label: "Exceptional communication" }, { value: "Confident & Fluent", marks: 3, label: "Confident & Fluent" }, { value: "Not Confident & Fluent", marks: 2, label: "Not Confident & Fluent" }, { value: "Confident & Not Fluent", marks: 1, label: "Confident & Not Fluent" }, { value: "Not Confident & Not Fluent", marks: 0, label: "Not Confident & Not Fluent" } ];
const incrutierTechTheoryOptions = [ { value: "In-depth understanding of the concept and clarity in explanations", marks: 4, label: "In-depth understanding" }, { value: "Solid understanding with minor gaps", marks: 3, label: "Solid understanding" }, { value: "Basic understanding but lacks depth", marks: 2, label: "Basic understanding" }, { value: "Limited grasp of concepts", marks: 1, label: "Limited grasp" }, { value: "Lack of understanding in concepts", marks: 0, label: "Lacks understanding" }, { value: "Didn't Ask", marks: 0, label: "Didn't Ask" } ];
const incrutierProgrammingOptions = [ { value: "Able to solve", marks: 4, label: "Able to solve" }, { value: "Able to tell approach, unable to solve", marks: 3, label: "Able to tell approach, unable to solve" }, { value: "Understood the question, Unable to tell approach", marks: 2, label: "Understood, unable to tell approach" }, { value: "Unable to understand the question", marks: 1, label: "Unable to understand question" }, { value: "Copied", marks: 0, label: "Copied" }, { value: "Didn't Ask", marks: 0, label: "Didn't Ask" } ];
const companyClosingRatingOptions = [ { value: "Positive", marks: 20, label: "Positive" }, { value: "Negative", marks: 10, label: "Negative" }, { value: "Neutral", marks: 0, label: "Neutral" }];

const presentationMap = createMarkMap(presentationOptions); 
const communicationMap = createMarkMap(communicationOptions); 
const theoryMap = createMarkMap(theoryOptions); 
const codingMap = createMarkMap(codingOptions); 
const projectExplanationMap = createMarkMap(projectExplanationOptions);
const companyInteractionQualityMap = createMarkMap(companyInteractionQualityOptions); 
const incrutierSelfIntroMap = createMarkMap(incrutierSelfIntroOptions); 
const incrutierProjectExpMap = createMarkMap(incrutierProjectExpOptions); 
const incrutierCommSkillsMap = createMarkMap(incrutierCommSkillsOptions); 
const incrutierTechTheoryMap = createMarkMap(incrutierTechTheoryOptions); 
const incrutierProgrammingMap = createMarkMap(incrutierProgrammingOptions); 
const companyClosingRatingMap = createMarkMap(companyClosingRatingOptions);

export const sheetConfig = {
    aseRatings: {
        title: "Companies & Students (ASE ratings)",
        requiredField: 'studentName',
        columns: [
            // UPDATED COLUMN ORDER
            { header: 'NIAT ID', field: 'niatId' }, 
            { header: 'Student Name', field: 'studentName' }, 
            { header: 'Company', field: 'companyName' },
            { header: 'Tech Stack', field: 'techStack' },
            { header: 'ASE', field: 'ase' },
            { header: 'Presentation', field: 'presentation', type: 'dropdown', options: presentationOptions },
            { header: 'Communication', field: 'communication', type: 'dropdown', options: communicationOptions },
            { header: 'Theory Answers', field: 'theoryAnswers', type: 'dropdown', options: theoryOptions },
            { header: 'Coding', field: 'coding', type: 'dropdown', options: codingOptions },
            { header: 'Project Explanation', field: 'projectExplanation', type: 'dropdown', options: projectExplanationOptions },
            { header: 'Probability', field: 'probability', type: 'dropdown', options: probabilityOptions },
            { header: 'Overall Marks', field: 'overallMarks', readOnly: true },
            { header: 'Remarks', field: 'remarks'},
            { header: 'Interaction Remarks', field: 'interactionRemarks' },
            { header: 'Feeling about internship', field: 'studentFeeling' }
        ],
    },
    companyInteractions: {
        title: "Company Interaction Rating", requiredField: 'companyName', columns: [
            { header: 'Company', field: 'companyName' }, 
            { header: 'NIAT ID', field: 'niatId' }, 
            { header: 'Student Name', field: 'studentName' },
            { header: 'Training Plan', field: 'trainingPlan' },
            { header: 'Training Covered', field: 'trainingCovered' }, 
            { header: 'Interaction Quality', field: 'interactionQuality', type: 'dropdown', options: companyInteractionQualityOptions }, 
            { header: 'Remarks', field: 'remarks' }, 
            { header: 'Overall Marks', field: 'overallMarks', readOnly: true } 
        ]
    },
    assignmentRatings: {
        title: "Assignments Rating",
        requiredField: 'niatId',
        columns: [
            { header: 'Company', field: 'companyName' },
            { header: 'NIAT ID', field: 'niatId' },
            { header: 'Student Name', field: 'studentName' },
            { header: 'Date', field: 'date', type: 'date' },
            { header: 'Tech Stack', field: 'techStack' },
            { header: 'Topic', field: 'topic' },
            { header: 'Student Question', field: 'studentQuestion', type: 'textarea' },
            { header: 'Student Answer', field: 'studentAnswer', type: 'textarea' },
            { header: 'Marks (X/10)', field: 'marks' },
            { header: 'Remarks', field: 'remarks' },
            { header: 'Overall Marks', field: 'overallMarks', readOnly: true }
        ]
    },
    incrutierRatings: {
        title: "Incrutier Rating",
        requiredField: 'studentName',
        columns: [
            { header: 'Company', field: 'companyName' },
            { header: 'NIAT ID', field: 'niatId' },
            { header: 'Student Name', field: 'studentName' },
            { header: 'Self Introduction', field: 'selfIntroduction', type: 'dropdown', options: incrutierSelfIntroOptions },
            { header: 'Project Explanation', field: 'projectExplanation', type: 'dropdown', options: incrutierProjectExpOptions },
            { header: 'Communication', field: 'communicationSkills', type: 'dropdown', options: incrutierCommSkillsOptions },
            { header: 'Technical Theory', field: 'technicalTheory', type: 'dropdown', options: incrutierTechTheoryOptions },
            { header: 'Programming', field: 'programming', type: 'dropdown', options: incrutierProgrammingOptions },
            { header: 'Recording Link', field: 'recordingLink', type: 'link' },
            { header: 'Remarks', field: 'remarks' },
            { header: 'Overall Marks', field: 'overallMarks', readOnly: true }
        ]
    },
    companyClosings: {
        title: "Company Closing Rating", 
        requiredField: 'companyName', 
        columns: [
            { header: 'Company', field: 'companyName' }, 
            { header: 'NIAT ID', field: 'niatId' }, 
            { header: 'Student Name', field: 'studentName' }, 
            { header: 'Date', field: 'date', type: 'date' }, 
            { header: 'Rating', field: 'rating', type: 'dropdown', options: companyClosingRatingOptions }, 
            { header: 'Marks', field: 'marks', readOnly: true }, 
            { header: 'Remarks', field: 'remarks' }, 
            { header: 'Overall Marks', field: 'overallMarks', readOnly: true },
            { header: 'History', field: 'editHistory', minWidth: '150px' } // --- START: MODIFICATION ---
        ]
    },
    // --- END: MODIFICATION ---
};

export const ratingCalculations = {
    aseRatings: (row) => `${(presentationMap.get(row.presentation) || 0) + (communicationMap.get(row.communication) || 0) + (theoryMap.get(row.theoryAnswers) || 0) + (codingMap.get(row.coding) || 0) + (projectExplanationMap.get(row.projectExplanation) || 0)} / 20`,
    companyInteractions: (row) => {
        // --- START FIX ---
        if (!row.interactionQuality || typeof row.interactionQuality !== 'string') {
            return `0 / 20`;
        }
        // Find the option whose value is a substring of the database value
        const foundOption = companyInteractionQualityOptions.find(opt => 
            row.interactionQuality.includes(opt.value)
        );
        const marks = foundOption ? foundOption.marks : 0;
        return `${marks * 5} / 20`;
        // --- END FIX ---
    },
    assignmentRatings: (row) => `${(parseInt(row.marks?.split('/')[0]) || 0)} / 10`,
    incrutierRatings: (row) => `${(incrutierSelfIntroMap.get(row.selfIntroduction) || 0) + (incrutierProjectExpMap.get(row.projectExplanation) || 0) + (incrutierCommSkillsMap.get(row.communicationSkills) || 0) + (incrutierTechTheoryMap.get(row.technicalTheory) || 0) + (incrutierProgrammingMap.get(row.programming) || 0)} / 20`,
    companyClosings: (row) => `${companyClosingRatingMap.get(row.rating) || 0} / 20`,
};

export const aggregateAssignmentMarks = (allAssignments) => {
    const studentAssignments = {};
    allAssignments.forEach(a => {
        if (!studentAssignments[a.niatId]) { studentAssignments[a.niatId] = { total: 0, count: 0, originalRows: [] }; }
        const mark = parseInt(a.marks?.split('/')[0], 10) || 0;
        studentAssignments[a.niatId].total += mark;
        studentAssignments[a.niatId].count++;
        studentAssignments[a.niatId].originalRows.push(a);
    });

    const result = [];
    Object.values(studentAssignments).forEach(student => {
        const averageMark = student.count > 0 ? (student.total / student.count) * 2 : 0;
        student.originalRows.forEach(row => { result.push({ ...row, overallMarks: `${averageMark.toFixed(2)} / 20` }); });
    });
    return result;
};

export const calculateCompanyClosingScore = (allClosings) => {
    const studentScores = {};
    allClosings.forEach(c => {
        const key = `${c.companyName}|${c.niatId}`;
        if (!studentScores[key]) { studentScores[key] = []; }
        studentScores[key].push(companyClosingRatingMap.get(c.rating) || 0);
    });

    return allClosings.map(row => {
        const key = `${row.companyName}|${row.niatId}`;
        const scores = studentScores[key] || [];
        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
        return { ...row, marks: companyClosingRatingMap.get(row.rating) || 0, overallMarks: `${maxScore} / 20` };
    });
};
