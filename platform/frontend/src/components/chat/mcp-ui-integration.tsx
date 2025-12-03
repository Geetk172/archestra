 "use client";

import { UIResourceRenderer } from '@mcp-ui/client';
import type { EmbeddedResource } from '@modelcontextprotocol/sdk/types.js';
import { useState } from 'react';
import { toast } from 'sonner';

interface McpUIResourceProps {
  resource: Partial<EmbeddedResource['resource']>;
  className?: string;
}

export function McpUIResource({ resource, className }: McpUIResourceProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUIAction = async (result: any) => {
    setIsLoading(true);
    try {
      console.log('MCP UI Action:', result);
      
      // Handle different types of UI actions
      switch (result.type) {
        case 'notification':
          if (result.intent === 'success') {
            toast.success(result.message);
          } else if (result.intent === 'error') {
            toast.error(result.message);
          } else {
            toast(result.message);
          }
          break;
          
        case 'link':
          if (result.url) {
            window.open(result.url, '_blank');
          }
          break;
          
        case 'prompt':
          // Handle prompt actions - could trigger new chat messages
          console.log('Prompt action:', result.prompt);
          break;
          
        case 'toolCall':
          // Handle tool call actions
          console.log('Tool call action:', result);
          break;
          
        default:
          console.log('Unknown action type:', result);
      }
    } catch (error) {
      console.error('Error handling MCP UI action:', error);
      toast.error('Failed to handle UI action');
    } finally {
      setIsLoading(false);
    }
  };

  if (!resource) {
    return null;
  }

  return (
    <div className={`mcp-ui-resource relative ${className || ''}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      <UIResourceRenderer
        resource={resource}
        onUIAction={handleUIAction}
        supportedContentTypes={['rawHtml', 'externalUrl', 'remoteDom']}
        htmlProps={{
          className: 'mcp-ui-html-content',
          style: { maxWidth: '100%' }
        }}
        remoteDomProps={{
          className: 'mcp-ui-remote-dom-content'
        }}
      />
    </div>
  );
}

interface McpUIIntegrationProps {
  mcpResources?: Array<Partial<EmbeddedResource['resource']>>;
  toolOutput?: any;
  className?: string;
}

export function McpUIIntegration({ 
  mcpResources, 
  toolOutput, 
  className 
}: McpUIIntegrationProps) {
  // Try to extract MCP UI resources from tool output
  const extractedResources = extractMcpResourcesFromToolOutput(toolOutput);
  const allResources = [...(mcpResources || []), ...extractedResources];

  if (allResources.length === 0) {
    return null;
  }

  return (
    <div className={`mcp-ui-integration space-y-4 ${className || ''}`}>
      {allResources.map((resource, index) => (
        <McpUIResource 
          key={`mcp-resource-${index}`} 
          resource={resource}
          className="border rounded-lg p-4"
        />
      ))}
    </div>
  );
}

// Helper function to extract MCP resources from tool output
function extractMcpResourcesFromToolOutput(output: any): Array<Partial<EmbeddedResource['resource']>> {
  if (!output) return [];
  
  try {
    // Handle string output
    if (typeof output === 'string') {
      try {
        const parsed = JSON.parse(output);
        return extractFromParsedOutput(parsed);
      } catch {
        // Check if it's HTML content
        if (output.includes('<') && output.includes('>')) {
          return [{
            text: output,
            mimeType: 'text/html'
          }];
        }
        return [];
      }
    }
    
    // Handle object output
    if (typeof output === 'object') {
      return extractFromParsedOutput(output);
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting MCP resources:', error);
    return [];
  }
}

function extractFromParsedOutput(parsed: any): Array<Partial<EmbeddedResource['resource']>> {
  const resources: Array<Partial<EmbeddedResource['resource']>> = [];
  
  // Check for embedded resources
  if (parsed.resources && Array.isArray(parsed.resources)) {
    resources.push(...parsed.resources);
  }
  
  // Check for single resource
  if (parsed.resource) {
    resources.push(parsed.resource);
  }
  
  // Check for UI content
  if (parsed.ui || parsed.uiContent) {
    const uiContent = parsed.ui || parsed.uiContent;
    resources.push({
      text: typeof uiContent === 'string' ? uiContent : JSON.stringify(uiContent),
      mimeType: 'application/vnd.mcp-ui.remote-dom+json'
    });
  }
  
  // Check for HTML content
  if (parsed.html) {
    resources.push({
      text: parsed.html,
      mimeType: 'text/html'
    });
  }
  
  return resources;
}

export default McpUIIntegration;
