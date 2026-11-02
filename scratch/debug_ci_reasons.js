const { evaluateAdherenceForHfId } = require('../backend/services/gdmtEvaluationService');

async function test() {
    const res20 = await evaluateAdherenceForHfId(20);
    console.log('=== HF 20 Evaluation Details ===');
    console.log('contraBB:', res20.contraBB);
    console.log('contraAce:', res20.contraAce);
    console.log('contraArb:', res20.contraArb);
    console.log('contraMra:', res20.contraMra);
    console.log('contraArni:', res20.contraArni);
    console.log('contraSglt2:', res20.contraSglt2);
    console.log('Details:', res20.details);

    const res54 = await evaluateAdherenceForHfId(54);
    console.log('\n=== HF 54 Evaluation Details ===');
    console.log('contraBB:', res54.contraBB);
    console.log('contraAce:', res54.contraAce);
    console.log('contraArb:', res54.contraArb);
    console.log('contraMra:', res54.contraMra);
    console.log('contraArni:', res54.contraArni);
    console.log('contraSglt2:', res54.contraSglt2);
    console.log('Details:', res54.details);

    process.exit(0);
}

test();

