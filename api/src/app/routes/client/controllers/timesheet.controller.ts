import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as HttpStatus from 'http-status-codes';
import { 
  retrieveTimesheets, 
  retrieveTimesheetById, 
  createTimesheet, 
  deleteTimesheet, 
  updateTimesheet, 
  retrieveForLightTimesheet, 
  retrieveForLightTimesheetPreview 
} from '../../../services/client/timesheet.service';
import { ITimesheet } from '../../../models/interfaces/i-timesheet';
import { 
  createTimesheetEntry, 
  deleteEntryByTimesheetId, 
  updateTimesheetEntry, 
  retrieveTimesheetEntriesForUser 
} from '../../../services/client/timesheetEntry.service';
import { IAuth } from '../../../models/interfaces/i-auth';
import { authorize } from '../../../services/common/authorize.service';

export const getTimesheets = async (ctx: Koa.Context) => {
  try {
    const timesheets = await retrieveTimesheets(ctx.query.projectId, ctx.query.startDate, ctx.query.endDate);
    ctx.body = timesheets;
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const getTimesheetById = async (ctx: Koa.Context) => {
  try {
    ctx.body = await retrieveTimesheetById(ctx.params.id);
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const getTimeSheetLight = async (ctx: Koa.Context) => {
  try {
    const model = ctx.request.body;
    if (!model) {
      ctx.throw('no data Found');
      return;
    }
    const timesheets = await retrieveForLightTimesheetPreview(
      model.project, 
      model.projectRfx, 
      model.rfxPhase, 
      model.userId, 
      model.entryDate);
    
    if (timesheets && timesheets.length) {
      const existingRecords = [];
      timesheets.forEach((timesheet) => {
        const existingEntry = timesheet.timesheetEntries.find((value, i, arr) => {
          return Date.parse(value.entryDate.toString()) === Date.parse(model.entryDate.toString());
        });
        if (existingEntry) {
          existingRecords.push(existingEntry);
        }
      });
      ctx.body = existingRecords;
    } else {
      ctx.status = HttpStatus.NO_CONTENT;
    }
    
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const createLightTimesheet = async (ctx: Koa.Context) => {
  try {    
    const auth = ctx.state.auth as IAuth;
    const model = ctx.request.body as ITimesheet;
    if (!model) {
      ctx.throw('no data Found');
      return;
    }

    const validationErrors = await validateCreateTimesheet(model);    
    if (validationErrors.length > 0) {
      ctx.throw(validationErrors.join(','));
      return;
    }
    const validationErrorsEntity = await validateTimesheetEntries(model);
    if (validationErrorsEntity.length > 0) {
      ctx.response.status = HttpStatus.PRECONDITION_FAILED;
      ctx.body = {
        entityValidationErrors: validationErrorsEntity,
        status: HttpStatus.PRECONDITION_FAILED
      };
      return;
    }

    if (!(model.entries && model.entries.length === 1)) {
      ctx.throw('This request expects one entry in the entries array.');
      return;
    }

    const entry = model.entries[0];

    const timesheet = await retrieveForLightTimesheet(
      model.project.id, 
      model.projectRfx.id, 
      model.rfxPhase.id, 
      model.userId, 
      model.isBillable, 
      entry.entryDate);

    let timesheetId: string;
    if (timesheet) {
      timesheetId = timesheet.id;
      model.id = timesheetId;
      const existingEntry = timesheet.timesheetEntries.find((value, i, arr) => {
        return Date.parse(value.entryDate.toString()) === Date.parse(entry.entryDate.toString());
      });
      if (existingEntry) {
        entry.id = existingEntry.id;
      }
    } else {
      model.id = undefined;
      model.createdUserId = auth.userId;

      const createdTimesheet = await createTimesheet(model);
      timesheetId = createdTimesheet.id;
      model.id = timesheetId;
    }
  
    
    if (entry.id) {
      await updateTimesheetEntry(entry.id, {
        rfxPhaseId: model.rfxPhase.id,
        userId: model.userId,
        hoursBilled: entry.hoursBilled,
        entryDate: entry.entryDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        comments: entry.comments
      });          
    } else {
      entry.id = undefined;
      entry.timesheet = model; 
      entry.projectId = model.project.id;
      entry.projectRfxId = model.projectRfx.id;          
      entry.rfxPhaseId = model.rfxPhase.id;
      entry.userId = model.userId;
      
      await createTimesheetEntry(entry);
    }
    
    ctx.body = await retrieveTimesheetById(timesheetId);
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const createTimesheetAction = async (ctx: Koa.Context) => {
  try {    
    const auth = ctx.state.auth as IAuth;
    const timesheetModel = ctx.request.body as ITimesheet;
    if (!timesheetModel) {
      ctx.throw('no data Found');
      return;
    }

    const validationErrors = await validateCreateTimesheet(timesheetModel);    
    if (validationErrors.length > 0) {
      ctx.throw(validationErrors.join(','));
      return;
    }
    if (timesheetModel.entries && timesheetModel.entries.length > 0) {
      const validationErrorsEntity = await validateTimesheetEntries(timesheetModel);
      if (validationErrorsEntity.length > 0) {
        ctx.response.status = HttpStatus.PRECONDITION_FAILED;
        ctx.body = {
          entityValidationErrors: validationErrorsEntity,
          status: HttpStatus.PRECONDITION_FAILED
        };
        return;
      }
    }

    timesheetModel.id = undefined;
    timesheetModel.createdUserId = auth.userId;

    const timesheet = await createTimesheet(timesheetModel);
    await createOrUpdateTimesheetEntries(timesheet.id, timesheetModel);
    
    ctx.body = await retrieveTimesheetById(timesheet.id);
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const updateTimesheetAction = async (ctx: Koa.Context) => {
  try {    
    const auth = ctx.state.auth as IAuth;
    const model = ctx.request.body as ITimesheet;
    if (!model) {
      ctx.throw('no data Found');
      return;
    }
    
    const validationErrors = await validateUpdateTimesheet(model);    
    if (validationErrors.length > 0) {
      ctx.throw(validationErrors.join(','));
      return;
    }
    if (model.entries && model.entries.length > 0) {
      const validationErrorsEntity = await validateTimesheetEntries(model);
      if (validationErrorsEntity.length > 0) {
        ctx.response.status = HttpStatus.PRECONDITION_FAILED;
        ctx.body = {
          entityValidationErrors: validationErrorsEntity,
          status: HttpStatus.PRECONDITION_FAILED
        };
        return;
      }
    }

    await updateTimesheet(ctx.params.id, {
      rfxPhase: { id: model.rfxPhase.id },
      userId: model.userId, 
      isBillable: model.isBillable,
      modifiedUserId: auth.userId
    });

    await createOrUpdateTimesheetEntries(ctx.params.id, model);

    ctx.body = await retrieveTimesheetById(ctx.params.id);
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const deleteTimesheetAction = async (ctx: Koa.Context) => {
  try {
    await deleteEntryByTimesheetId(ctx.params.id);
    const deleted = await deleteTimesheet(ctx.params.id);
    ctx.body = (deleted && deleted.affected && (deleted.affected === 1)) ? {
      status: 200,
      message: 'Success'
    } : {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'failed'
    };
  } catch (err) {
    ctx.throw(err.message);
  }
};

const createOrUpdateTimesheetEntries = async (timesheetId: string, model: ITimesheet) => {
  if (model.entries) {
    model.id = timesheetId;
    for (let index = 0; index < model.entries.length; index++) {
      const entry = model.entries[index];
      
      if (entry.id) {
        await updateTimesheetEntry(entry.id, {
          rfxPhaseId: model.rfxPhase.id,
          userId: model.userId,
          hoursBilled: entry.hoursBilled,
          entryDate: entry.entryDate,
          startTime: entry.startTime,
          endTime: entry.endTime,
          comments: entry.comments
        });          
      } else {
        entry.id = undefined;
        entry.timesheet = model; 
        entry.projectId = model.project.id;
        entry.projectRfxId = model.projectRfx.id;          
        entry.rfxPhaseId = model.rfxPhase.id;
        entry.userId = model.userId;
        
        await createTimesheetEntry(entry);
      }
    }
  }
};

const validateCreateTimesheet = async (timesheet: ITimesheet) => {
  
  const validationErrors = [];
    
  if (!(timesheet.project && timesheet.project.id)) {
    validationErrors.push('Project is required.');
  }
  if (!(timesheet.projectRfx && timesheet.projectRfx.id)) {
    validationErrors.push('ProjectRfx is required.');
  }
  if (!timesheet.startDate) {
    validationErrors.push('Start Date is required.');
  }
  if (!timesheet.endDate) {
    validationErrors.push('End Date is required.');
  }
  if (timesheet.entries && timesheet.entries.length > 0) {
    const errors = await validateUpdateTimesheet(timesheet);
    validationErrors.push(...errors);
  }

  return validationErrors;
};

const validateUpdateTimesheet = async (timesheet: ITimesheet) => {
  
  const validationErrors = [];
    
  if (!(timesheet.rfxPhase && timesheet.rfxPhase.id)) {
    validationErrors.push('Rfx Phase is required.');
  }
  if (!timesheet.userId) {
    validationErrors.push('User is required.');
  }
  if (typeof timesheet.isBillable !== 'boolean') {
    validationErrors.push('isBillable is required.');
  }

  return validationErrors;
};

const validateTimesheetEntries = async (timesheet: ITimesheet) => {
  const validationErrors = [];

  const userEntries = await retrieveTimesheetEntriesForUser(timesheet.userId, timesheet.startDate, timesheet.endDate);

  for (let index = 0; index < timesheet.entries.length; index++) {
    const entry = timesheet.entries[index];

    const entriesForDate = userEntries.filter((value) => {
      return Date.parse(value.entryDate.toString()) === Date.parse(entry.entryDate.toString());
    });

    if (entriesForDate && entriesForDate.length > 0) { 
      const existingEntry = entriesForDate.find((value) => { 
        return value.id === entry.id; 
      });
      let totalTime = entriesForDate.map(m => m.hoursBilled).reduce((p, n) => p + n);
      totalTime = totalTime - ((existingEntry && existingEntry.hoursBilled) || 0);
      const calcTime = totalTime + entry.hoursBilled;
      if (calcTime > 24) {
        validationErrors.push({
          date: entry.entryDate,
          message: `Hours billed should not be more than 24 hours across Projects for a date: ${entry.entryDate}.`
        });
      }
    }
  }
  return validationErrors;
};

const routerOpts: Router.IRouterOptions = {
  prefix: '/timesheet'
};

const router: Router = new Router(routerOpts);

router.get('/', authorize, getTimesheets);
router.get('/:id', authorize, getTimesheetById);
router.post('/', authorize, createTimesheetAction);
router.post('/light', authorize, createLightTimesheet);
router.post('/getLight', authorize, getTimeSheetLight);
router.patch('/:id', authorize, updateTimesheetAction);
router.delete('/:id', authorize, deleteTimesheetAction);

export default router;
