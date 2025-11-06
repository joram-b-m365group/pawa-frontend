import { X, Check, Zap, Crown, Rocket } from 'lucide-react'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlan: (plan: string) => void
}

export default function PricingModal({ isOpen, onClose, onSelectPlan }: PricingModalProps) {
  if (!isOpen) return null

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Zap,
      color: 'from-gray-500 to-gray-700',
      features: [
        '10 messages per day',
        'Basic AI responses',
        'Standard speed',
        'Community support'
      ],
      disabled: ['Advanced reasoning', 'Priority support', 'Custom models', 'API access']
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      icon: Crown,
      color: 'from-blue-500 to-purple-600',
      popular: true,
      features: [
        'Unlimited messages',
        'Advanced AI responses',
        'Priority speed',
        'Advanced reasoning',
        'Image understanding',
        'Code execution',
        'Email support'
      ],
      disabled: ['Custom models', 'API access']
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      icon: Rocket,
      color: 'from-purple-500 to-pink-600',
      features: [
        'Everything in Pro',
        'Custom trained models',
        'API access',
        'White-label options',
        'Dedicated support',
        'SLA guarantee',
        'Team collaboration',
        'Advanced analytics'
      ],
      disabled: []
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-gray-400 mt-2">Unlock the full power of Genius AI</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 p-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20'
                    : 'border-gray-800 bg-gray-800/50'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Name & Price */}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-400 ml-2">/ {plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                  {plan.disabled.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 opacity-40">
                      <X className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-500 line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan(plan.name.toLowerCase())}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  }`}
                >
                  {plan.name === 'Free' ? 'Current Plan' : 'Upgrade Now'}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 px-8 py-6 bg-gray-900/50">
          <p className="text-center text-gray-400 text-sm">
            All plans include our core AI capabilities. Cancel anytime, no questions asked.
          </p>
        </div>
      </div>
    </div>
  )
}
