<template>
  <div class="overview-container">
    <div class="header-actions">
      <!-- <el-button type="primary" @click="navigateToAuthServer">
        跳转到认证服务器
      </el-button> -->
    </div>

    <div class="topology-diagram">
      <h2>系统拓扑图</h2>
      <div id="topology-container" ref="topologyContainer"></div>
    </div>
  </div>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'
import * as d3 from 'd3'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Overview',
  setup() {
    const topologyContainer = ref(null)
    const store = useStore()
    
    // 初始化时获取客户端列表并监听变化
    onMounted(() => {
        if (topologyContainer.value) {
          renderTopology(topologyContainer.value)
        }

        // 添加窗口大小变化监听
        const handleResize = () => {
          if (topologyContainer.value) {
            renderTopology(topologyContainer.value)
          }
        }

        window.addEventListener('resize', handleResize)
        
        // 监听客户端列表变化
        const unsubscribe = store.subscribe((mutation) => {
          if (mutation.type === 'clients/SET_CLIENTS' || 
              mutation.type === 'clients/ADD_CLIENT' || 
              mutation.type === 'clients/UPDATE_CLIENT_STATUS') {
            if (topologyContainer.value) {
              renderTopology(topologyContainer.value)
            }
          }
        })

        // 清理函数
        return () => {
          window.removeEventListener('resize', handleResize)
          unsubscribe()
        }
      })

    const navigateToAuthServer = () => {
      // 这里预留后端接口位置
      console.log('跳转到认证服务器')
      // 实际应用中可以使用window.location.href或者router.push
    }

    const renderTopology = (container) => {
        // 清除之前的内容
        d3.select(container).select('svg').remove()

        // 获取容器的实际尺寸
        const containerRect = container.getBoundingClientRect()
        const actualWidth = containerRect.width
        const actualHeight = containerRect.height

        // 动态计算节点间距，确保在不同尺寸下都有良好显示
        const nodeDistance = Math.min(actualWidth / 6, 120)
        const nodeRadius = Math.min(actualHeight / 20, 30)

      // 创建SVG
        const svg = d3.select(container)
          .append('svg')
          .attr('width', actualWidth)
          .attr('height', actualHeight)
          .style('background-color', '#f9f9f9')

      // 添加左侧层级标识
      svg.append('g')
        .attr('transform', 'translate(80, 100)')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('font-weight', 'bold')
        .attr('fill', '#3498db')
        .text('DEBEClient')

      svg.append('g')
        .attr('transform', 'translate(80, 250)')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('font-weight', 'bold')
        .attr('fill', '#3498db')
        .text('EdgeServer')

      svg.append('g')
        .attr('transform', 'translate(80, 400)')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', 16)
        .attr('font-weight', 'bold')
        .attr('fill', '#3498db')
        .text('Cloud')

      // 从store获取客户端列表
      let clientList = store.getters['clients/getAllClients'] || []
      
      // 如果没有客户端列表，使用mock数据（仅用于开发测试）
      if (!clientList || clientList.length === 0) {
        console.log('没有实际客户端数据，使用示例数据展示拓扑图')
        // 注意：根据需求，这里不添加任何客户端节点
      }
      
      // 定义节点数据
      const nodes = []
      // 添加固定的EdgeServer和Cloud节点
      nodes.push({ id: 'edge1', name: 'EdgeServer1', group: 2, x: actualWidth / 2, y: 250 })
      nodes.push({ id: 'cloud1', name: 'Cloud1', group: 3, x: actualWidth / 2, y: 400 })
      
      // 动态添加客户端节点
      const clientCount = clientList.length
      const startX = actualWidth / 2 - (clientCount - 1) * nodeDistance / 2
      
      clientList.forEach((client, index) => {
        nodes.push({
          id: `client-${client.name}`,
          name: `client: ${client.name}`,
          group: 1,
          x: startX + index * nodeDistance,
          y: 100
        })
      })

      // 定义链接数据
      const links = []
      // 所有客户端连接到EdgeServer
      clientList.forEach(client => {
        links.push({ source: `client-${client.name}`, target: 'edge1' })
      })
      // EdgeServer连接到Cloud
      links.push({ source: 'edge1', target: 'cloud1' })

      // 创建力导向图
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(nodeDistance))
        .force('charge', d3.forceManyBody().strength(-2000))
        .force('center', d3.forceCenter(actualWidth / 2, actualHeight / 2))
        // 保持节点在指定的y轴位置附近
        .force('y', d3.forceY(d => {
          if (d.group === 1) return 100
          if (d.group === 2) return 250
          return 400
        }).strength(1))

      // 绘制链接
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('stroke', '#999')
        .attr('stroke-width', 2)

      // 绘制节点组
      const node = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter()
        .append('g')
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
        )

      // 绘制节点图片
      node.append('image')
        .attr('x', -nodeRadius)
        .attr('y', -nodeRadius)
        .attr('width', nodeRadius * 2)
        .attr('height', nodeRadius * 2)
        .attr('xlink:href', d => {
          if (d.group === 1) return '/src/assets/终端设备.png'
          if (d.group === 2) return '/src/assets/服务器.png'
          return '/src/assets/云服务器.png'
        })

      // 绘制节点标签
      node.append('text')
        .attr('dy', nodeRadius + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .attr('font-size', Math.max(nodeRadius / 3, 10))
        .text(d => d.name)

      // 节点点击事件
      node.on('click', (event, d) => {
        showNodeInfo(d)
      })

      // 更新力导向图
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node.attr('transform', d => `translate(${d.x},${d.y})`)
      })

      // 拖拽函数
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      }

      function dragged(event, d) {
        d.fx = event.x
        // 限制只能在同一层级内拖动
        d.fy = d.group === 1 ? 100 : d.group === 2 ? 250 : 400
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      }
    }

    const showNodeInfo = (node) => {
      // 这里预留后端接口位置
      console.log('查看节点信息:', node)
      // 实际应用中可以使用ElementUI的对话框组件展示详细信息
      alert(`节点名称: ${node.name}\n节点ID: ${node.id}\n节点类型: ${node.group === 1 ? 'DEBEClient' : node.group === 2 ? 'EdgeServer' : 'CloudServer'}`)
    }

    return {
      topologyContainer,
      navigateToAuthServer
    }
  }
})
</script>

<style scoped>
.overview-container {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.topology-diagram {
  margin-top: 20px;
}

#topology-container {
  width: 100%;
  height: 70vh;
  min-height: 400px;
  max-height: 800px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
</style>