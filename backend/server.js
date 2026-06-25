const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let conversationHistory = [];

const SYSTEM_PROMPT = `你是专业的UE蓝图设计助手，必须将自然语言需求转化为完整详细的蓝图逻辑。

【核心要求】
1. 必须生成至少8-15个节点，覆盖完整逻辑流程
2. 必须包含：事件节点、变量节点、逻辑控制（Branch/Loop）、函数节点
3. 必须生成完整的执行流程：从开始到结束的每个步骤

【JSON输出格式】
{
  "nodes": [
    {
      "id": "唯一ID",
      "type": "节点类型",
      "label": "显示名称",
      "x": 0, "y": 0,
      "color": "#颜色代码",
      "inputs": [{"name": "引脚名", "type": "类型"}],
      "outputs": [{"name": "引脚名", "type": "类型"}],
      "properties": {"属性名": "属性值"}
    }
  ],
  "connections": [
    {"fromNode": "源ID", "fromPin": "源引脚", "toNode": "目标ID", "toPin": "目标引脚"}
  ],
  "variables": [
    {"name": "变量名", "type": "类型", "defaultValue": "默认值", "description": "说明"}
  ],
  "description": "逻辑说明"
}

【节点类型库】
事件节点：EventBeginPlay, EventTick, EventActorBeginOverlap, InputAction
变量节点：SetVariable, GetVariable
逻辑节点：Branch(条件分支), Loop(循环)
函数节点：PrintString, PlaySound, SpawnActor, DestroyActor, AddActorWorldOffset, Delay, CastTo, GetPlayerPawn, ApplyDamage

【节点颜色】
事件#1a1a2e, 变量#16213e, 逻辑#0f3460, 函数#533483, 运算#e94560

【强制规则】
- 每个需求必须生成完整的执行流程
- Branch必须有两个输出（True/False）
- 必须有初始化逻辑（SetVariable设置初始值）
- 必须有结束条件或循环逻辑
- nodes数组至少包含8个节点
- connections必须连接所有节点的执行引脚

【示例：跳跃逻辑应生成】
EventBeginPlay → SetVariable(IsGrounded=True) → EventTick → Branch(IsGrounded) → [True]AddActorWorldOffset → SetVariable(IsGrounded=False) → Delay(0.5) → SetVariable(IsGrounded=True)`;

async function callSiliconFlow(messages) {
  try {
    const response = await fetch(process.env.SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.MODEL_NAME,
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('SiliconFlow API Error:', error);
    throw error;
  }
}

function parseBlueprintJson(responseText) {
  try {
    let jsonStr = responseText;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('JSON Parse Error:', error);
    return generateFallbackBlueprint(responseText);
  }
}

function generateFallbackBlueprint(text) {
  return {
    nodes: [
      {
        id: 'event_1',
        type: 'EventBeginPlay',
        label: 'Event BeginPlay',
        x: 50,
        y: 100,
        color: '#1a1a2e',
        inputs: [],
        outputs: [{ name: 'Then', type: 'Execution' }],
        properties: {}
      },
      {
        id: 'print_1',
        type: 'PrintString',
        label: 'Print String',
        x: 250,
        y: 100,
        color: '#533483',
        inputs: [{ name: 'In', type: 'Execution' }, { name: 'String', type: 'String' }],
        outputs: [{ name: 'Then', type: 'Execution' }],
        properties: { String: 'Blueprint generated from: ' + text.substring(0, 50) + '...' }
      }
    ],
    connections: [
      { fromNode: 'event_1', fromPin: 'Then', toNode: 'print_1', toPin: 'In' }
    ],
    variables: [],
    description: text
  };
}

function autoLayoutNodes(nodes) {
  const nodeWidth = 180;
  const nodeHeight = 80;
  const horizontalGap = 80;
  const verticalGap = 60;
  
  let currentX = 50;
  let currentY = 100;
  let maxY = 100;
  
  nodes.forEach((node, index) => {
    if (index > 0 && index % 3 === 0) {
      currentX += nodeWidth + horizontalGap;
      currentY = 100;
    }
    
    node.x = currentX;
    node.y = currentY;
    
    currentY += nodeHeight + verticalGap;
    maxY = Math.max(maxY, currentY);
  });
  
  return nodes;
}

function validateAndFixBlueprint(blueprint) {
  if (!blueprint.nodes) blueprint.nodes = [];
  if (!blueprint.connections) blueprint.connections = [];
  if (!blueprint.variables) blueprint.variables = [];
  
  blueprint.nodes = autoLayoutNodes(blueprint.nodes);
  
  const validNodeIds = new Set(blueprint.nodes.map(n => n.id));
  blueprint.connections = blueprint.connections.filter(conn => 
    validNodeIds.has(conn.fromNode) && validNodeIds.has(conn.toNode)
  );
  
  return blueprint;
}

app.post('/api/generate-blueprint', async (req, res) => {
  try {
    const { prompt, conversationId } = req.body;
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];
    
    const aiResponse = await callSiliconFlow(messages);
    let blueprint = parseBlueprintJson(aiResponse);
    blueprint = validateAndFixBlueprint(blueprint);
    
    const conversation = {
      id: conversationId || uuidv4(),
      timestamp: Date.now(),
      prompt: prompt,
      blueprint: blueprint
    };
    
    conversationHistory.unshift(conversation);
    if (conversationHistory.length > 50) {
      conversationHistory = conversationHistory.slice(0, 50);
    }
    
    res.json({
      success: true,
      conversationId: conversation.id,
      blueprint: blueprint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    history: conversationHistory
  });
});

app.get('/api/history/:id', (req, res) => {
  const { id } = req.params;
  const conversation = conversationHistory.find(c => c.id === id);
  
  if (conversation) {
    res.json({
      success: true,
      conversation: conversation
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }
});

app.delete('/api/history/:id', (req, res) => {
  const { id } = req.params;
  conversationHistory = conversationHistory.filter(c => c.id !== id);
  
  res.json({
    success: true
  });
});

app.delete('/api/history', (req, res) => {
  conversationHistory = [];
  res.json({
    success: true
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Blueprint Copilot Backend is running'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});