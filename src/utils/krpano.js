/**
 * krpano 工具类
 */
export default {
    /**
     * 嵌入 krpano 查看器
     * @param {string} containerId 容器ID
     * @param {string} xmlPath XML路径
     * @param {Function} onReady 加载完成回调
     */
    embedPanoViewer(containerId, xmlPath, onReady = null) {
        try {
            if (typeof window.embedpano === 'undefined') {
                console.error('krpano embedpano 未定义，请确保已加载 krpano.js');
                
                // 添加错误处理，显示友好的错误信息
                const container = document.getElementById(containerId);
                if (container) {
                    container.innerHTML = `
                        <div style="display:flex; justify-content:center; align-items:center; height:100%; background:#f0f2f5; color:#666; flex-direction:column;">
                            <h3 style="margin:0 0 10px">无法加载全景图</h3>
                            <p style="margin:0">请确保krpano.js正确加载</p>
                        </div>
                    `;
                }
                return null;
            }
            
            // krpano 嵌入配置
            const embedConfig = {
                target: containerId,
                html5: "prefer",
                mobilescale: 1.0,
                passQueryParameters: true,
                xml: xmlPath,
                onready: onReady
            };
            
            return window.embedpano(embedConfig);
        } catch (error) {
            console.error('嵌入全景图时发生错误:', error);
            return null;
        }
    },

    /**
     * 生成场景 XML
     * @param {Object} scene 场景数据
     * @param {Array} scenes 所有场景
     */
    generateSceneXml(scene, scenes = []) {
        // 简单实现，实际项目中应该有更复杂的XML生成逻辑
        let xml = `<krpano>
      <scene name="${scene.id}" title="${scene.name}">
        <view hlookat="${scene.initialView.hlookat}" vlookat="${scene.initialView.vlookat}" fov="${scene.initialView.fov}" />
        <image>
          <sphere url="${scene.panoramaImage}" />
        </image>`;

        // 添加热点
        scene.hotspots.forEach(hotspot => {
            xml += `
        <hotspot name="${hotspot.id}"
          style="hotspot_style"
          ath="${hotspot.ath}" atv="${hotspot.atv}"
          tooltip="${hotspot.name}"`;

            if (hotspot.type === 'scene' && hotspot.linkedSceneId) {
                xml += ` onclick="loadscene(${hotspot.linkedSceneId}, null, MERGE, BLEND(1));"`;
            } else if (hotspot.type === 'info') {
                xml += ` onclick="showtext(${hotspot.content});"`;
            }

            xml += ` />`;
        });

        xml += `
      </scene>
    </krpano>`;

        return xml;
    }
};
