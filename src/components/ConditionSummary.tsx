import { Card } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, XCircle, Plane } from "lucide-react";

interface ConditionSummaryProps {
  overallCondition: 'good' | 'caution' | 'poor';
  recommendations: string[];
  analysisSource?: 'n8n-llm' | 'fallback';
  enhancedAnalysis?: any;
}

export const ConditionSummary = ({ overallCondition, recommendations, analysisSource, enhancedAnalysis }: ConditionSummaryProps) => {
  const getConditionInfo = (condition: string) => {
    switch (condition) {
      case 'good':
        return {
          icon: CheckCircle,
          color: 'text-condition-good',
          bgColor: 'bg-condition-good/10',
          borderColor: 'border-condition-good',
          title: 'Excellent Flying Conditions',
          subtitle: 'Perfect conditions for RC flying!'
        };
      case 'caution':
        return {
          icon: AlertTriangle,
          color: 'text-condition-caution',
          bgColor: 'bg-condition-caution/10',
          borderColor: 'border-condition-caution',
          title: 'Fly with Caution',
          subtitle: 'Some conditions may affect flying'
        };
      case 'poor':
        return {
          icon: XCircle,
          color: 'text-condition-poor',
          bgColor: 'bg-condition-poor/10',
          borderColor: 'border-condition-poor',
          title: 'Not Recommended',
          subtitle: 'Poor conditions for RC flying'
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          borderColor: 'border-border',
          title: 'Unknown Conditions',
          subtitle: 'Unable to determine flying conditions'
        };
    }
  };

  const conditionInfo = getConditionInfo(overallCondition);
  const IconComponent = conditionInfo.icon;

  return (
    <Card className={`p-6 border-2 ${conditionInfo.borderColor} ${conditionInfo.bgColor} animate-fade-in`}>
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${conditionInfo.bgColor} ${conditionInfo.borderColor} border`}>
          <IconComponent className={`h-6 w-6 ${conditionInfo.color}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Plane className={`h-5 w-5 ${conditionInfo.color}`} />
            <h2 className={`text-xl font-bold ${conditionInfo.color}`}>
              {conditionInfo.title}
            </h2>
          </div>
          
          <p className="text-muted-foreground mb-4">
            {conditionInfo.subtitle}
            {analysisSource === 'n8n-llm' && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                AI Enhanced
              </span>
            )}
          </p>

          {enhancedAnalysis?.analysis?.detailedExplanation && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Detailed Analysis:</h4>
              <p className="text-sm text-muted-foreground">{enhancedAnalysis.analysis.detailedExplanation}</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Recommendations:</h3>
              <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};