import { Work, Scene, Material } from '@/models';
import { LocalStorage } from './storage';

const WORKS_KEY = 'pano_works';
const MATERIALS_KEY = 'pano_materials';

/**
 * 生成演示数据
 */
export function initializeData() {
    // 检查是否已有数据
    const existingWorks = LocalStorage.get(WORKS_KEY);
    const existingMaterials = LocalStorage.get(MATERIALS_KEY);
    
    if (!existingWorks || existingWorks.length === 0) {
        console.log('初始化作品数据...');
        const demoWorks = [
            new Work({
                id: '1',
                name: '演示作品',
                description: '这是一个演示作品，用于展示全景功能',
                coverImage: '/demo-cover.jpg',
                scenes: [
                    new Scene({
                        id: '1-1',
                        name: '客厅',
                        panoramaImage: '/demo-pano-1.jpg',
                        hotspots: []
                    })
                ],
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            })
        ];
        
        LocalStorage.save(WORKS_KEY, demoWorks);
    }
    
    if (!existingMaterials || existingMaterials.length === 0) {
        console.log('初始化素材数据...');
        const demoMaterials = [
            new Material({
                id: '1',
                name: '演示全景图',
                type: 'panorama',
                path: '/demo-pano-1.jpg',
                thumbnail: '/demo-pano-1-thumb.jpg',
                createTime: new Date().toISOString()
            })
        ];
        
        LocalStorage.save(MATERIALS_KEY, demoMaterials);
    }
}
