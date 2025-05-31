import { v6 as uuidv6 } from 'uuid';
import { Job, JobCategory, JobType, Parameter, Project, Task } from '../../../interface';
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';

const Colmap = ():Task => {
    const createsp:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.CREATE_DIR,
        script: "",
        string_args: ["%root%/%before%/%ck%/sparse/0"],
        number_args: [],
        boolean_args: []
    }
    const command1:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "feature_extractor --database_path sparse/0/database.db --image_path images"],
        number_args: [],
        boolean_args: []
    }
    const command2:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "exhaustive_matcher --database_path sparse/0/database.db"],
        number_args: [],
        boolean_args: []
    }
    const command3:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.COMMAND,
        script: "",
        string_args: ["%root%/%before%/%ck%", "colmap", "point_triangulator --database sparse/0/database.db --image_path images --input_path ../sparse/0/TXT/edit --output_path sparse/0"],
        number_args: [],
        boolean_args: []
    }
    const deleteion:Job = {
        uuid: uuidv6(),
        category: JobCategory.Execution,
        type: JobType.DELETE_FILE,
        script: "",
        string_args: ["%root%/%before%/%ck%/sparse/0/database.db"],
        number_args: [],
        boolean_args: []
    }

    const t:Task = {
        uuid: uuidv6(),
        title: "Colmap Data Compute",
        description: "Use Colmap to generate .bin data",
        setupjob: false,
        cronjob: true,
        cronjobKey: "frameCount",
        multi: false,
        multiKey: "",
        properties: [],
        jobs: [
            createsp,
            command1,
            command2,
            command3,
            deleteion
        ]
    }
    return t
}

export const GetFUNIQUE_GS4ProjectTemplate_Colmap = (r:Project):Project => {
    const para:Parameter = {
        uuid: uuidv6(),
        title: "GS4 Colmap Parameter",
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task = [
        Colmap(),
    ]
    return r;
}