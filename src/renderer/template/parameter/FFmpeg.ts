import { DataType, ParameterContainer } from "../../interface"

export const GetFFmpegProject_Parameter = ():ParameterContainer[] => {
    return [
        { name: "root", value: '', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "download", value: {
            src: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            output: "BigBuckBunny.mp4"
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "Video2I", value: {
            src: "BigBuckBunny.mp4",
            fps: "1",
            folder: "images",
            output: "images%04d.png"
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "I2Video", value: {
            framerate: 24,
            data: [
                {
                    src: "images/images%04d.png",
                    start: "00:00:00",
                    end: "00:05:00",
                    output: "output1.mp4"
                },
                {
                    src: "images/images%04d.png",
                    start: "00:00:00",
                    end: "00:09:56",
                    output: "output2.mp4"
                }
            ]
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "Concat", value: {
            videos: [
                "output1.mp4",
                "output2.mp4"
            ],
            output: "final.mov"
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "Transcode", value: {
            src: "BigBuckBunny.mp4",
            output: "transcode_final.mov"
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "resize", value: {
            src: "BigBuckBunny.mp4",
            output: "resize_final.mov",
            wiidth: 1920,
            height: 1080
        }, type: DataType.Object, runtimeOnly: false, hidden: false },
        { name: "crf", value: 21, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "fps", value: 24, type: DataType.Number, runtimeOnly: false, hidden: false },
        { name: "format", value: 'mp4', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "video_encode", value: 'h264', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "audio_encode", value: 'aac', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "pixel_format", value: 'yuv420p', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "video_bitrate", value: '50M', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "color_primaries", value: '1', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "color_trc", value: '1', type: DataType.String, runtimeOnly: false, hidden: false },
        { name: "colorspace", value: '1', type: DataType.String, runtimeOnly: false, hidden: false },
    ]
}