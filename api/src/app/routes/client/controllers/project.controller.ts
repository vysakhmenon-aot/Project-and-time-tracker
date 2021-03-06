import * as Koa from 'koa';
import * as Router from 'koa-router';
import { 
  retrieveProjects, 
  retrieveProjectById, 
  updateProject, 
  retrieveProjectsByUserId 
} from '../../../services/client/project.service';
import { IProject } from '../../../models/interfaces/i-project';
import { retrieveClientByProjectId } from '../../../services/client/client.service';
import { Role } from '../../roles';
import { IAuth } from '../../../models/interfaces/i-auth';
import { authorize } from '../../../services/common/authorize.service';

export const getProjects = async (ctx: Koa.Context) => {
  try {
    const auth = ctx.state.auth as IAuth;

    if (auth.role === Role.PSB_Admin) {
      ctx.body = await retrieveProjects();
    } else if (auth.role === Role.PSB_User) {
      ctx.body = await retrieveProjectsByUserId(auth.userId);
    }
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const getProjectById = async (ctx: Koa.Context) => {
  try {
    ctx.body = await retrieveProjectById(ctx.params.id);
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const updateProjectAction = async (ctx: Koa.Context) => {
  try {
    const auth = ctx.state.auth as IAuth;
    const project = ctx.request.body as IProject;
    if (!project) {
      ctx.throw('no data found');
      return;
    }
    
    const validationErrors = validateProject(project);    
    if (validationErrors.length > 0) {
      ctx.throw(validationErrors.join(','));
      return;
    }

    const updatingFields = {
      projectName: project.projectName,
      completionDate: project.completionDate,
      contractValue: project.contractValue,
      mouAmount: project.mouAmount || 0,
      description: project.description,
      leadUserId: project.leadUserId,
      backupUserId: project.backupUserId,
      modifiedUserId: auth.userId
    };

    const client = await retrieveClientByProjectId(ctx.params.id);
    if (project.leadUserId || project.backupUserId) {    
      if (!(client.clientNo > 0 && client.responsibilityCenter > 0 && client.serviceCenter > 0 && client.stob > 0 && client.projectCode > 0)) {
        ctx.throw('Project Lead/Backup cannot be assigned without providing all Finance Codes. Please fill the Finance Codes.');
        return;
      }
    }

    await updateProject(ctx.params.id, updatingFields);

    ctx.body = 'success';
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const assignLeadAction = async (ctx: Koa.Context) => {
  try {
    const obj = ctx.request.body as any;
    if (!(obj)) {
       ctx.throw('no data found');
       return;
    } else {
      const client = await retrieveClientByProjectId(ctx.params.id);
      if (!(client.clientNo > 0 && client.responsibilityCenter > 0 && 
        client.serviceCenter > 0 && client.stob > 0 && client.projectCode > 0)) {
          ctx.throw('Project Lead cannot be assigned without providing all Finance Codes. Please fill the Finance Codes in Project page.');
          return;
        }
    }
    
    await updateProject(ctx.params.id, {
        leadUserId: obj.userId
    });

    ctx.body = 'success';
  } catch (err) {
    ctx.throw(err.message);
  }
};

export const assignBackupAction = async (ctx: Koa.Context) => {
  try {
    const obj = ctx.request.body as any;
    if (!(obj)) {
       ctx.throw('no data found');
       return;
    } else {
      const client = await retrieveClientByProjectId(ctx.params.id);
      if (!(client.clientNo > 0 && client.responsibilityCenter > 0 && 
        client.serviceCenter > 0 && client.stob > 0 && client.projectCode > 0)) {
          ctx.throw('Project Backup cannot be assigned without providing all Finance Codes. Please fill the Finance Codes in Project page.');
          return;
        }
    }

    await updateProject(ctx.params.id, {
      backupUserId: obj.userId
    });

    ctx.body = 'success';
  } catch (err) {
    ctx.throw(err.message);
  }
};

const validateProject = (project: IProject) => {
  
  const validationErrors = [];
  
  if (!project.projectName) {
    validationErrors.push('Project Name is required.');
  }
  
  if (!project.completionDate) {
    validationErrors.push('Project Deadline is required.');
  }

  if (!project.description) {
    validationErrors.push('Description is required.');
  }

  if (!(project.contractValue && project.contractValue > 0)) {
    validationErrors.push('Contract Amount is required.');
  }
  
  return validationErrors;
};

const routerOpts: Router.IRouterOptions = {
  prefix: '/project'
};

const router: Router = new Router(routerOpts);

router.get('/', authorize, getProjects);
router.get('/:id', authorize, getProjectById);
router.patch('/:id', authorize, updateProjectAction);
// router.delete('/:id', deleteProjectAction); TODO: Implement in the 2nd phase of development.
router.post('/:id/assign-lead', authorize, assignLeadAction);
router.post('/:id/assign-backup', authorize, assignBackupAction);

export default router;
