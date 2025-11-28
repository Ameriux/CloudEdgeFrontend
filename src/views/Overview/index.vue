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
      // 添加Cloud节点
      nodes.push({ id: 'cloud1', name: 'Cloud1', group: 3, x: actualWidth / 2, y: 400 })
      
      // 从store获取EdgeServer列表
      const edgeServerList = store.getters['edgeServer/getAllServers'] || []
      
      // 动态添加EdgeServer节点
      const edgeCount = edgeServerList.length
      const edgeStartX = actualWidth / 2 - (edgeCount - 1) * nodeDistance / 2
      
      edgeServerList.forEach((server, index) => {
        nodes.push({
          id: `edge-${server.id}`,
          name: server.deviceName,
          group: 2,
          x: edgeStartX + index * nodeDistance,
          y: 250
        })
      })
      
      // 动态添加客户端节点
      const clientCount = clientList.length
      const clientStartX = actualWidth / 2 - (clientCount - 1) * nodeDistance / 2
      
      clientList.forEach((client, index) => {
        nodes.push({
          id: `client-${client.name}`,
          name: `client: ${client.name}`,
          group: 1,
          x: clientStartX + index * nodeDistance,
          y: 100
        })
      })

      // 定义链接数据
      const links = []
      // 获取客户端与EdgeServer的连接关系
      const clientEdgeConnections = store.getters['clients/getClientEdgeConnections'] || {}
      
      // 根据连接关系为客户端添加到EdgeServer的链接
      clientList.forEach(client => {
        const connectedEdgeIp = clientEdgeConnections[client.name]
        if (connectedEdgeIp) {
          // 查找对应的EdgeServer
          const connectedEdge = edgeServerList.find(server => server.ipAddress === connectedEdgeIp)
          if (connectedEdge) {
            links.push({ 
              source: `client-${client.name}`, 
              target: `edge-${connectedEdge.id}`
            })
          }
        }
      })
      
      // 每个EdgeServer连接到Cloud
      edgeServerList.forEach((server, index) => {
        links.push({ source: `edge-${server.id}`, target: 'cloud1' })
      })
      
      // 添加EdgeServer之间的备份关系连线
      edgeServerList.forEach(server => {
        if (server.backupNodes && server.backupNodes.length > 0) {
          server.backupNodes.forEach(backupNode => {
            // 查找备份节点对应的EdgeServer
            const targetServer = edgeServerList.find(s => s.deviceName === backupNode.deviceName)
            if (targetServer) {
              links.push({
                source: `edge-${server.id}`,
                target: `edge-${targetServer.id}`,
                type: 'backup', // 标记为备份关系线
                label: '备份至'
              })
            }
          })
        }
      })

      // 创建力导向图，优化布局效果
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(nodeDistance))
        .force('charge', d3.forceManyBody().strength(-2000))
        .force('center', d3.forceCenter(actualWidth / 2, actualHeight / 2))
        .force('collision', d3.forceCollide().radius(nodeRadius * 1.5))
        // 保持节点在指定的y轴位置附近
        .force('y', d3.forceY(d => {
          if (d.group === 1) return 100
          if (d.group === 2) return 250
          return 400
        }).strength(1))
        .alphaDecay(0.02) // 减缓收敛速度，使布局更稳定
        .velocityDecay(0.4) // 控制速度衰减

      // 创建箭头标记定义
      const defs = svg.append('defs')
      
      // 普通箭头
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 9) // 调整箭头位置
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999')
      
      // 备份关系箭头
      defs.append('marker')
        .attr('id', 'backup-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 9)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ff6b6b')
      
      // 绘制链接
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke-width', d => Math.sqrt(d.value || 1))
        .attr('stroke', d => d.type === 'backup' ? '#ff6b6b' : '#999') // 备份关系线使用红色
        .attr('stroke-opacity', d => d.type === 'backup' ? 0.8 : 0.6)
        .attr('stroke-dasharray', d => d.type === 'backup' ? '5,5' : 'none') // 备份线使用虚线
        .attr('marker-end', d => d.type === 'backup' ? 'url(#backup-arrow)' : 'url(#arrowhead)')
        .style('transition', 'stroke-opacity 0.3s ease-in-out')
        
      // 为备份关系线添加传输动画效果
      const backupLinks = link.filter(d => d.type === 'backup')
      
      // 为每条备份线创建动画效果
      backupLinks.each(function(d) {
        const line = d3.select(this)
        
        // 创建传输点
        const marker = line.node().parentNode.appendChild(
          document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        )
        const markerCircle = d3.select(marker)
          .attr('r', 4)
          .attr('fill', '#fff')
          .attr('stroke', '#ff6b6b')
          .attr('stroke-width', 2)
          .style('pointer-events', 'none')
        
        // 定义动画函数
        function animateMarker() {
          const x1 = d.source.x
          const y1 = d.source.y
          const x2 = d.target.x
          const y2 = d.target.y
          
          markerCircle
            .transition()
            .duration(3000)
            .attrTween('cx', function() {
              return function(t) { return x1 + (x2 - x1) * t }
            })
            .attrTween('cy', function() {
              return function(t) { return y1 + (y2 - y1) * t }
            })
            .ease(d3.easeLinear)
            .on('end', animateMarker)
        }
        
        // 开始动画
        animateMarker()
      })
      
      // 为备份关系线添加文字标签
      const linkLabels = svg.append('g')
        .selectAll('text')
        .data(links.filter(d => d.type === 'backup'))
        .join('text')
        .attr('class', 'link-label')
        .text(d => d.label)
        .attr('font-size', 12)
        .attr('fill', '#ff6b6b')
        .attr('text-anchor', 'middle')
        .attr('dy', '-5') // 文字位置向上偏移

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
        .on('mouseover', function(event, d) {
          // 悬停效果 - 放大节点
          d3.select(this).select('image')
            .transition()
            .duration(200)
            .attr('x', -nodeRadius * 1.1)
            .attr('y', -nodeRadius * 1.1)
            .attr('width', nodeRadius * 2.2)
            .attr('height', nodeRadius * 2.2)
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('filter', 'drop-shadow(0 6px 8px rgba(0, 0, 0, 0.2))')
        })
        .on('mouseout', function(event, d) {
          // 恢复默认大小
          d3.select(this).select('image')
            .transition()
            .duration(200)
            .attr('x', -nodeRadius)
            .attr('y', -nodeRadius)
            .attr('width', nodeRadius * 2)
            .attr('height', nodeRadius * 2)
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('filter', '')
        })

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
        .attr('pointer-events', 'none')

      // 绘制节点标签
      node.append('text')
        .attr('dy', nodeRadius + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .attr('font-size', Math.max(nodeRadius / 3, 10))
        .attr('pointer-events', 'none')
        .text(d => d.name)

      // 节点点击事件
      node.on('click', (event, d) => {
        showNodeInfo(d)
      })

      // 更新链接和节点位置的动画
      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)

        node.attr('transform', d => `translate(${d.x}, ${d.y})`)
        
        // 更新链接标签位置
        linkLabels
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2)
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