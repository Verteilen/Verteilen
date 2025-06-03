import { v6 as uuidv6 } from 'uuid';
import { Parameter, Project } from "../../../interface"
import { GetFUNIQUE_GS4Project_Parameter_Builder } from '../../parameter/GS4';
import { PlyList } from './OutputPly';
import { BlendPrepare, BlendPrepare2 } from './GenerateBlendPrepare';
import { Checkpoint_Position, Checkpoint_Negative } from './GenerateBlendResult';
import { Colmap } from './GenerateColmap';
import { IFrame, Denoise, IFrameBackup, IFrameGTP_Adjustment } from './GenerateIFrame';
import { Prepare } from './GeneratePrepare';
import { PlyBlend1, PlyBlend2 } from './PlyBlend';

export const GetFUNIQUE_GS4ProjectTemplate_Full = (r:Project):Project => {
    const para:Parameter = {
        title: "GS4 Ply Output Parameter",
        uuid: uuidv6(),
        canWrite: true,
        containers: GetFUNIQUE_GS4Project_Parameter_Builder()
    }
    r.parameter = para
    r.task.push(...[
        Prepare(),
        Colmap(),
        IFrame(),
        Denoise(),
        IFrameBackup(),
        IFrameGTP_Adjustment(),
        BlendPrepare(),
        BlendPrepare2(),
        Checkpoint_Position(),
        Checkpoint_Negative(),
        PlyList(),
        PlyBlend1(),
        PlyBlend2(),
    ])
    return r
}