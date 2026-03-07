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
// 导入图片资源
import terminalDeviceImage from '@/assets/终端设备.png'
import serverImage from '@/assets/服务器.png'
import cloudServerImage from '@/assets/云服务器.png'

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

        // 动态计算节点间距和大小，确保在不同尺寸下都有良好显示
        const nodeDistance = Math.min(actualWidth / 7, 100)
        const nodeRadius = Math.min(actualHeight / 22, 28)
        const levelHeights = [100, 250, 400] // Client, EdgeServer, Cloud的Y轴位置

      // 创建SVG
        const svg = d3.select(container)
          .append('svg')
          .attr('width', actualWidth)
          .attr('height', actualHeight)
          .style('background-color', '#f5f7fa')
          .style('border-radius', '8px')

      // 添加背景网格线
      const gridLines = svg.append('g')
        .attr('class', 'grid')
        .style('opacity', 0.1)
        
      // 水平网格线
      for (let y = 0; y < actualHeight; y += 50) {
        gridLines.append('line')
          .attr('x1', 0)
          .attr('y1', y)
          .attr('x2', actualWidth)
          .attr('y2', y)
          .style('stroke', '#999')
          .style('stroke-width', 1)
      }
      
      // 垂直网格线
      for (let x = 0; x < actualWidth; x += 50) {
        gridLines.append('line')
          .attr('x1', x)
          .attr('y1', 0)
          .attr('x2', x)
          .attr('y2', actualHeight)
          .style('stroke', '#999')
          .style('stroke-width', 1)
      }

      // 添加层级背景
      levelHeights.forEach((y, index) => {
        svg.append('rect')
          .attr('x', 0)
          .attr('y', y - 70)
          .attr('width', actualWidth)
          .attr('height', 140)
          .attr('fill', index === 0 ? '#e3f2fd' : index === 1 ? '#e8f5e9' : '#fff8e1')
          .attr('opacity', 0.6)
      })

      // 添加左侧层级标识
      const levelLabels = ['Client', 'EdgeServer', 'Cloud']
      const levelColors = ['#2196f3', '#4caf50', '#ff9800']
      
      levelLabels.forEach((label, index) => {
        const y = levelHeights[index]
        
        // 添加标签背景
        svg.append('rect')
          .attr('x', 10)
          .attr('y', y - 15)
          .attr('width', 140)
          .attr('height', 30)
          .attr('fill', levelColors[index])
          .attr('opacity', 0.1)
          .attr('rx', 4)
        
        // 添加标签文本
        svg.append('g')
          .attr('transform', `translate(80, ${y + 5})`)
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('font-size', 16)
          .attr('font-weight', 'bold')
          .attr('fill', levelColors[index])
          .text(label)
      })

      // 从store获取客户端列表
      let clientList = store.getters['clients/getAllClients'] || []
      
      // 如果没有客户端列表，使用mock数据（仅用于开发测试）
      if (!clientList || clientList.length === 0) {
        console.log('没有实际客户端数据，使用示例数据展示拓扑图')
        // 注意：根据需求，这里不添加任何客户端节点
      }
      
      // 定义节点数据
      const nodes = []
      // 从store获取EdgeServer列表
      const edgeServerList = store.getters['edgeServer/getAllServers'] || []
      
      // 计算每个层级的最大节点数，用于确定布局范围
      const maxNodesPerLevel = Math.max(clientList.length, edgeServerList.length, 1)
      const levelWidth = maxNodesPerLevel * nodeDistance
      const levelStartX = actualWidth / 2 - levelWidth / 2 + nodeDistance / 2
      
      // 添加Cloud节点（居中放置）
      nodes.push({ id: 'cloud1', name: 'Cloud1', group: 3, x: actualWidth / 2, y: levelHeights[2] })
      
      // 动态添加EdgeServer节点（均匀分布）
      const edgeCount = edgeServerList.length
      edgeServerList.forEach((server, index) => {
        let x
        if (edgeCount === 1) {
          x = actualWidth / 2
        } else {
          const offset = (index / (edgeCount - 1)) * levelWidth
          x = levelStartX + offset
        }
        
        nodes.push({
          id: `edge-${server.id}`,
          name: server.deviceName,
          group: 2,
          x: x,
          y: levelHeights[1]
        })
      })
      
      // 动态添加客户端节点（均匀分布）
      const clientCount = clientList.length
      clientList.forEach((client, index) => {
        let x
        if (clientCount === 1) {
          x = actualWidth / 2
        } else {
          const offset = (index / (clientCount - 1)) * levelWidth
          x = levelStartX + offset
        }
        
        nodes.push({
          id: `client-${client.name}`,
          name: `client: ${client.name}`,
          group: 1,
          x: x,
          y: levelHeights[0]
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
        // 链接力 - 调整距离和强度
        .force('link', d3.forceLink(links)
          .id(d => d.id)
          .distance(d => d.type === 'backup' ? nodeDistance * 1.5 : nodeDistance)
          .strength(0.8)
        )
        // 电荷力 - 调整强度使节点适当分开
        .force('charge', d3.forceManyBody()
          .strength(-1200)
          .distanceMin(nodeDistance * 0.5)
          .distanceMax(nodeDistance * 3)
        )
        // 碰撞力 - 防止节点重叠
        .force('collision', d3.forceCollide()
          .radius(nodeRadius * 1.6)
          .strength(1)
          .iterations(12)
        )
        // 层级力 - 保持节点在指定的y轴位置
        .force('y', d3.forceY(d => levelHeights[d.group - 1]).strength(2.0))
        // X轴对齐力 - 使同层级节点水平对齐
        .force('x', d3.forceX(d => {
          // 对于同层级节点，尽量保持初始水平分布
          return d.x
        }).strength(0.8))
        // 优化衰减参数
        .alphaDecay(0.02)
        .velocityDecay(0.7)
        .alphaTarget(0.1)
        .stop() // 先停止模拟，准备手动迭代

      // 手动运行指定次数的迭代，确保布局稳定
      simulation.tick(30)

      // 创建箭头标记定义
      const defs = svg.append('defs')
      
      // 普通箭头
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 7)
        .attr('markerHeight', 7)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4')
        .attr('fill', '#666')
        .attr('stroke', '#666')
        .attr('stroke-width', 0.5)
      
      // 备份关系箭头
      defs.append('marker')
        .attr('id', 'backup-arrow')
        .attr('viewBox', '0 -6 12 12')
        .attr('refX', 11)
        .attr('refY', 0)
        .attr('markerWidth', 9)
        .attr('markerHeight', 9)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L12,0L0,5')
        .attr('fill', '#ff6b6b')
        .attr('stroke', '#ff6b6b')
        .attr('stroke-width', 0.8)
      
      // 绘制链接
      const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke-width', d => d.type === 'backup' ? 2.5 : 1.8)
        .attr('stroke', d => d.type === 'backup' ? '#ff6b6b' : '#666') // 备份关系线使用红色
        .attr('stroke-opacity', d => d.type === 'backup' ? 0.9 : 0.7)
        .attr('stroke-dasharray', d => d.type === 'backup' ? '8,4' : 'none') // 备份线使用虚线
        .attr('marker-end', d => d.type === 'backup' ? 'url(#backup-arrow)' : 'url(#arrowhead)')
        .style('transition', 'all 0.3s ease-in-out')
        // 添加鼠标悬停效果
        .on('mouseover', function(event, d) {
          d3.select(this)
            .attr('stroke-opacity', 1)
            .attr('stroke-width', d.type === 'backup' ? 3.5 : 2.5)
        })
        .on('mouseout', function(event, d) {
          d3.select(this)
            .attr('stroke-opacity', d.type === 'backup' ? 0.9 : 0.7)
            .attr('stroke-width', d.type === 'backup' ? 2.5 : 1.8)
        })
        
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
        .attr('font-weight', 'bold')
        .attr('fill', '#ff6b6b')
        .attr('text-anchor', 'middle')
        .attr('dy', '-8') // 文字位置向上偏移
        .style('text-shadow', '1px 1px 2px rgba(255, 255, 255, 0.8)')
        .style('pointer-events', 'none')

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
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // 悬停效果 - 放大节点
          d3.select(this).select('image')
            .transition()
            .duration(250)
            .ease(d3.easeElasticOut)
            .attr('x', -nodeRadius * 1.2)
            .attr('y', -nodeRadius * 1.2)
            .attr('width', nodeRadius * 2.4)
            .attr('height', nodeRadius * 2.4)
          
          // 添加发光效果
          d3.select(this)
            .transition()
            .duration(200)
            .attr('filter', 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.25))')
          
          // 高亮相关连线
          link.filter(l => l.source.id === d.id || l.target.id === d.id)
            .transition()
            .duration(200)
            .attr('stroke-opacity', 1)
            .attr('stroke-width', l => l.type === 'backup' ? 3.5 : 2.5)
        })
        .on('mouseout', function(event, d) {
          // 恢复默认大小
          d3.select(this).select('image')
            .transition()
            .duration(250)
            .ease(d3.easeElasticOut)
            .attr('x', -nodeRadius)
            .attr('y', -nodeRadius)
            .attr('width', nodeRadius * 2)
            .attr('height', nodeRadius * 2)
          
          // 移除发光效果
          d3.select(this)
            .transition()
            .duration(200)
            .attr('filter', '')
          
          // 恢复连线默认样式
          link.filter(l => l.source.id === d.id || l.target.id === d.id)
            .transition()
            .duration(200)
            .attr('stroke-opacity', l => l.type === 'backup' ? 0.9 : 0.7)
            .attr('stroke-width', l => l.type === 'backup' ? 2.5 : 1.8)
        })

      // 绘制节点背景圆
      node.append('circle')
        .attr('r', nodeRadius * 1.2)
        .attr('fill', d => {
          if (d.group === 1) return '#e3f2fd'
          if (d.group === 2) return '#e8f5e9'
          return '#fff8e1'
        })
        .attr('stroke', d => {
          if (d.group === 1) return '#2196f3'
          if (d.group === 2) return '#4caf50'
          return '#ff9800'
        })
        .attr('stroke-width', 2)
        .style('transition', 'all 0.3s ease-in-out')
      
      // 绘制节点图片
      node.append('image')
        .attr('x', -nodeRadius)
        .attr('y', -nodeRadius)
        .attr('width', nodeRadius * 2)
        .attr('height', nodeRadius * 2)
        .attr('xlink:href', d => {
          if (d.group === 1) return terminalDeviceImage
          if (d.group === 2) return serverImage
          return cloudServerImage
        })
        .attr('pointer-events', 'none')
        .attr('preserveAspectRatio', 'xMidYMid meet')

      // 绘制节点标签
      node.append('text')
        .attr('dy', nodeRadius + 22)
        .attr('text-anchor', 'middle')
        .attr('fill', '#333')
        .attr('font-size', Math.max(nodeRadius / 3.2, 11))
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .attr('style', 'white-space: nowrap;')
        .text(d => d.name)

      // 节点点击事件
      node.on('click', (event, d) => {
        // 添加点击动画
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .scale(0.95)
          .transition()
          .duration(150)
          .scale(1)
          .on('end', () => showNodeInfo(d))
      })

      // 更新链接和节点位置的动画
      simulation.on('tick', () => {
        // 限制节点在各自的层级区域内
        nodes.forEach(d => {
          // 严格限制Y轴位置在层级区域内
          const levelY = levelHeights[d.group - 1]
          d.y = levelY
          
          // 轻微限制X轴位置，防止节点过度分散
          d.x = Math.max(nodeRadius * 2, Math.min(actualWidth - nodeRadius * 2, d.x))
        })
        
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
          .attr('transform', d => {
            // 计算连线角度，使标签旋转以匹配连线方向
            const dx = d.target.x - d.source.x
            const dy = d.target.y - d.source.y
            const angle = Math.atan2(dy, dx) * 180 / Math.PI
            return `rotate(${angle}, ${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`
          })
      })
      
      // 布局完成后，固定所有节点位置，确保它们不再移动
      setTimeout(() => {
        nodes.forEach(d => {
          // 固定节点位置，不再受力导向图影响
          d.fx = d.x
          d.fy = d.y
        })
        simulation.alpha(0).restart()
      }, 500)
      
      // 添加初始动画效果
      node.attr('opacity', 0)
        .attr('transform', d => `translate(${d.x}, ${d.y - 20})`)
        .transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .ease(d3.easeElasticOut)
        .attr('opacity', 1)
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
      
      link.attr('stroke-opacity', 0)
        .transition()
        .duration(1000)
        .delay(200)
        .attr('stroke-opacity', d => d.type === 'backup' ? 0.9 : 0.7)

      // 拖拽函数
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.4).restart()
        d.fx = d.x
        d.fy = d.y
        // 拖拽时高亮节点
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('filter', 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))')
      }

      function dragged(event, d) {
        d.fx = event.x
        // 限制只能在同一层级内拖动
        d.fy = levelHeights[d.group - 1]
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0)
        // 保留拖拽后的位置，使布局更稳定
        d.fx = d.x
        d.fy = d.y
        // 恢复默认效果
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr('filter', '')
      }
    }

    const showNodeInfo = (node) => {
      // 这里预留后端接口位置
      console.log('查看节点信息:', node)
      // 实际应用中可以使用ElementUI的对话框组件展示详细信息
      alert(`节点名称: ${node.name}\n节点ID: ${node.id}\n节点类型: ${node.group === 1 ? 'Client' : node.group === 2 ? 'EdgeServer' : 'CloudServer'}`)
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
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.topology-diagram {
  margin-top: 20px;
}

.topology-diagram h2 {
  text-align: center;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
}

#topology-container {
  width: 100%;
  height: 70vh;
  min-height: 500px;
  max-height: 900px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .overview-container {
    padding: 10px;
  }
  
  .topology-diagram h2 {
    font-size: 20px;
  }
  
  #topology-container {
    height: 60vh;
    min-height: 400px;
  }
}
</style>