// const { Component, Revision } = require('../../../models/chat/code/Component.js');
// const { generateNewComponent, reviseComponent } = require('../../../../ignore/cleanup/cleanup/cleanup/aiService.js');

// const createComponent = async (userId, prompt) => {
//   const result = await generateNewComponent(prompt);

//   const newComponent = new Component({
//     code: result,
//     authorId: userId,
//     prompt: prompt,
//     revisions: [{ code: result, prompt: prompt }],
//   });

//   await newComponent.save();

//   return newComponent._id;
// };

// const makeRevision = async (userId, revisionId, prompt) => {
//   const baseRevision = await Revision.findOne({ _id: revisionId }).populate('componentId');

//   if (!baseRevision || baseRevision.componentId.authorId.toString() !== userId.toString()) {
//     throw new Error('No component found');
//   }

//   const result = await reviseComponent(prompt, baseRevision.code);

//   const newRevision = new Revision({
//     code: result,
//     prompt: prompt,
//     componentId: baseRevision.componentId._id,
//   });

//   await newRevision.save();

//   baseRevision.componentId.code = result;
//   baseRevision.componentId.prompt = prompt;
//   baseRevision.componentId.revisions.push(newRevision);
//   await baseRevision.componentId.save();

//   return newRevision._id;
// };

// const forkRevision = async (userId, revisionId, includePrevious) => {
//   const component = await Component.findOne({ 'revisions._id': revisionId }).populate('revisions');

//   const revisionIndex = component.revisions.findIndex(rev => rev._id.toString() === revisionId);
//   if (!component || revisionIndex === -1) {
//     throw new Error('No revision found');
//   }

//   const revisions = (
//     includePrevious ? component.revisions.slice(0, revisionIndex + 1) : [component.revisions[revisionIndex]]
//   ).map(({ code, prompt }) => ({ code, prompt }));

//   if (revisions.length < 1) {
//     throw new Error('No revision found');
//   }

//   if (component.authorId.toString() !== userId.toString() && component.visibility === 'PRIVATE') {
//     throw new Error("You don't have the permission to fork this revision");
//   }

//   const newComponent = new Component({
//     code: revisions[0].code,
//     authorId: userId,
//     prompt: revisions[0].prompt,
//     revisions: revisions,
//   });

//   await newComponent.save();

//   return newComponent.revisions[0]._id;
// };

// const getComponent = async (id, userId) => {
//   const component = await Component.findById(id).populate('revisions');

//   if (!component) {
//     throw new Error('No component found');
//   }

//   if (component.authorId.toString() !== userId && component.visibility === 'PRIVATE') {
//     throw new Error('Unauthorized');
//   }

//   return component;
// };

// const getComponentFromRevision = async (revisionId, userId) => {
//   const component = await Component.findOne({ 'revisions._id': revisionId }).populate('revisions');

//   if (!component) {
//     throw new Error('No component found');
//   }

//   if (component.authorId.toString() !== userId && component.visibility === 'PRIVATE') {
//     throw new Error('Unauthorized');
//   }

//   return component;
// };

// const getMyComponents = async (userId, pageIndex, pageSize) => {
//   const componentCount = await Component.countDocuments({ authorId: userId });

//   const components = await Component.find({ authorId: userId })
//     .populate('revisions')
//     .skip(pageSize * pageIndex)
//     .limit(pageSize)
//     .sort({ createdAt: 'desc' });

//   return {
//     rows: components,
//     pageCount: Math.ceil(componentCount / pageSize),
//   };
// };

// const importComponent = async (code, description) => {
//   const newComponent = new Component({
//     code,
//     prompt: description,
//     revisions: [{ code, prompt: description }],
//   });

//   await newComponent.save();

//   return newComponent._id;
// };

// module.exports = {
//   createComponent,
//   makeRevision,
//   forkRevision,
//   getComponent,
//   getComponentFromRevision,
//   getMyComponents,
//   importComponent,
// };
