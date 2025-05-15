/**
 * 作品模型
 */
export class Work {
    constructor({
        id = Date.now().toString(),
        name = '',
        description = '',
        coverImage = '',
        scenes = [],
        createTime = new Date().toISOString(),
        updateTime = new Date().toISOString()
    } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.coverImage = coverImage;
        this.scenes = scenes; // 场景列表
        this.createTime = createTime;
        this.updateTime = updateTime;
    }
}

/**
 * 场景模型
 */
export class Scene {
    constructor({
        id = Date.now().toString(),
        name = '',
        panoramaImage = '',
        hotspots = [],
        initialView = { hlookat: 0, vlookat: 0, fov: 90 }
    } = {}) {
        this.id = id;
        this.name = name;
        this.panoramaImage = panoramaImage; // 全景图素材ID
        this.hotspots = hotspots; // 热点列表
        this.initialView = initialView; // 初始视角
    }
}

/**
 * 热点模型
 */
export class Hotspot {
    constructor({
        id = Date.now().toString(),
        name = '',
        type = 'scene', // scene, info, image, url
        ath = 0, // 水平角度
        atv = 0, // 垂直角度
        linkedSceneId = '', // 链接到的场景ID
        content = '' // 信息内容或URL等
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.ath = ath;
        this.atv = atv;
        this.linkedSceneId = linkedSceneId;
        this.content = content;
    }
}

/**
 * 素材模型
 */
export class Material {
    constructor({
        id = Date.now().toString(),
        name = '',
        type = 'panorama', // panorama, hotspot, sound
        path = '',
        thumbnail = '',
        createTime = new Date().toISOString()
    } = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.path = path; // 本地文件路径
        this.thumbnail = thumbnail; // 缩略图路径
        this.createTime = createTime;
    }
}
