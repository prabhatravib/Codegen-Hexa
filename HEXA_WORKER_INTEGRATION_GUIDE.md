# Hexa-Worker Integration Guide

## Overview
This guide explains the frontend implementation for session synchronization between the voice agent and external data (code flow diagrams). The frontend now sends session IDs to ensure both the voice session and external data use the same session context.

## Frontend Implementation Completed

### 1. Session Manager (`apps/frontend/src/utils/sessionManager.ts`)
- **Purpose**: Centralized session ID management
- **Features**:
  - Generate unique session IDs (UUID v4)
  - Subscribe to session changes
  - Maintain session state across components
  - Automatic session ID generation when needed

### 2. CodeGenInterface Updates (`apps/frontend/src/components/CodeGenInterface.tsx`)
- **Changes**:
  - Import session manager
  - Get/generate session ID before sending external data
  - Include `sessionId` in external data payload
  - Log session ID for debugging

**Payload Structure**:
```json
{
  "image": "base64_image_or_empty",
  "text": "```mermaid\nflowchart TD...",
  "prompt": "Add two numbers",
  "type": "diagram",
  "sessionId": "uuid-v4-session-id"
}
```

### 3. HexaWorker Updates (`apps/frontend/src/components/HexaWorker.tsx`)
- **Changes**:
  - Subscribe to session manager changes
  - Pass session ID to iframe via URL parameter
  - Generate session ID when voice is first enabled
  - Log session ID for debugging

**Iframe URL**: `https://hexa-worker.prabhatravib.workers.dev/?sessionId=uuid-v4-session-id`

## Required Hexa-Worker Implementation

### 1. External Data Endpoint Enhancement
**Current**: `/api/external-data` (POST)
**Required Changes**:

```javascript
// When external data is received
app.post('/api/external-data', async (req, res) => {
  const { image, text, prompt, type, sessionId } = req.body;
  
  // 1. Store external data with session ID
  await storeExternalData(sessionId, {
    image,
    text, 
    prompt,
    type,
    timestamp: new Date().toISOString()
  });
  
  // 2. TRIGGER: Notify voice session of new external data
  await notifyVoiceSession(sessionId, 'external_data_available', {
    mermaidCode: text,
    originalPrompt: prompt,
    diagramType: type,
    timestamp: new Date().toISOString()
  });
  
  res.json({ 
    success: true, 
    sessionId,
    message: 'External data received and context updated'
  });
});
```

### 2. Voice Session Integration
**Required**: Voice session should subscribe to external data events

```javascript
// Voice session should listen for external data events
voiceSession.on('external_data_available', async (sessionId, data) => {
  // Add external data to voice agent context
  await addToVoiceContext(sessionId, {
    type: 'external_data',
    content: data,
    available: true
  });
  
  // Log for debugging
  console.log('🎯 External data added to voice context:', data);
});
```

### 3. Session ID Handling
**Required**: Extract session ID from iframe URL parameter

```javascript
// When iframe loads, extract session ID from URL
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId');

if (sessionId) {
  console.log('🆔 Voice session started with session ID:', sessionId);
  // Initialize voice session with this session ID
  initializeVoiceSession(sessionId);
}
```

### 4. Missing Endpoint Implementation
**Required**: Implement `/api/external-data/status` (GET)

```javascript
app.get('/api/external-data/status', async (req, res) => {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }
  
  const externalData = await getExternalData(sessionId);
  
  res.json({
    hasExternalData: !!externalData,
    dataType: externalData?.type || null,
    timestamp: externalData?.timestamp || null,
    sessionId: sessionId
  });
});
```

## Expected Behavior After Implementation

### 1. Normal Flow
1. User enables voice → Session ID generated
2. User creates code flow → External data sent with session ID
3. Hexa-worker receives data → Triggers voice context update
4. Voice agent can now reference the code flow

### 2. Voice Conversation
```
User: "Can you explain this code flow?"
Voice Agent: "I can see you have a diagram about adding two numbers. Let me explain the flow..."
```

### 3. Debug Logs
Frontend will show:
```
🆔 Generated new session ID: abc-123-def
🆔 Using existing session ID: abc-123-def
🆔 HexaWorker received session ID: abc-123-def
🆔 Voice session started with session ID: abc-123-def
✅ Diagram data sent to hexagon worker: {success: true, sessionId: "abc-123-def"}
```

## Key Integration Points

### 1. Session Synchronization
- Frontend generates and maintains session ID
- Both voice and external data use same session ID
- Hexa-worker matches data to correct voice session

### 2. Event-Driven Architecture
- External data receipt triggers voice context update
- No polling required - immediate context availability
- Clean separation between data storage and voice processing

### 3. Context Integration
- External data automatically added to voice agent context
- Voice agent only references data when user asks
- Reactive behavior - no proactive announcements

## Testing Checklist

### Frontend (Completed)
- ✅ Session ID generation works
- ✅ External data includes session ID
- ✅ Iframe receives session ID via URL
- ✅ Session manager maintains state

### Hexa-Worker (Required)
- [ ] External data endpoint accepts session ID
- [ ] Voice session extracts session ID from URL
- [ ] External data triggers voice context update
- [ ] Status endpoint returns correct data
- [ ] Voice agent can access external data in conversations

## Priority Implementation Order

1. **High Priority**: Extract session ID from iframe URL
2. **High Priority**: Add session ID to external data storage
3. **High Priority**: Implement trigger mechanism for voice context
4. **Medium Priority**: Add status endpoint
5. **Low Priority**: Enhanced error handling and logging

## Success Criteria

The implementation is successful when:
1. Voice agent can reference code flow diagrams in conversations
2. External data is immediately available after creation
3. Session IDs properly synchronize voice and external data
4. No 404 errors on status endpoint
5. Natural conversation flow maintained
